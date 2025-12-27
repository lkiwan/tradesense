"""
Calendar Service - Aggregates economic events from multiple sources

Data Sources (in priority order):
1. Investing.com scraping (primary)
2. Forex Factory scraping (backup)
3. Moroccan events (Bank Al-Maghrib)
4. Database events (manual/cached)
"""
import requests
from bs4 import BeautifulSoup
from datetime import datetime, date, timedelta
import logging
import re
from typing import Dict, List, Optional, Any
import json

logger = logging.getLogger(__name__)


# Moroccan Economic Events - Bank Al-Maghrib, HCP
MOROCCAN_EVENTS = {
    "quarterly": [
        {
            "event": "Bank Al-Maghrib Interest Rate Decision",
            "currency": "MAD",
            "impact": "high",
            "frequency": "quarterly",
            "months": [3, 6, 9, 12],
            "typical_day": 21
        },
        {
            "event": "Morocco GDP Growth Rate",
            "currency": "MAD",
            "impact": "high",
            "frequency": "quarterly",
            "months": [2, 5, 8, 11],
            "typical_day": 15
        }
    ],
    "monthly": [
        {
            "event": "Morocco CPI Inflation",
            "currency": "MAD",
            "impact": "medium",
            "frequency": "monthly",
            "typical_day": 20
        },
        {
            "event": "Morocco Unemployment Rate",
            "currency": "MAD",
            "impact": "medium",
            "frequency": "monthly",
            "typical_day": 10
        },
        {
            "event": "Morocco Trade Balance",
            "currency": "MAD",
            "impact": "medium",
            "frequency": "monthly",
            "typical_day": 25
        },
        {
            "event": "Morocco Industrial Production",
            "currency": "MAD",
            "impact": "low",
            "frequency": "monthly",
            "typical_day": 28
        }
    ]
}


class CalendarService:
    """
    Economic Calendar Service with multi-source data aggregation.
    """

    INVESTING_URL = "https://www.investing.com/economic-calendar/"
    FOREX_FACTORY_URL = "https://www.forexfactory.com/calendar"

    # Country/currency flag mapping
    CURRENCY_FLAGS = {
        "USD": "🇺🇸", "EUR": "🇪🇺", "GBP": "🇬🇧", "JPY": "🇯🇵",
        "AUD": "🇦🇺", "CAD": "🇨🇦", "CHF": "🇨🇭", "CNY": "🇨🇳",
        "NZD": "🇳🇿", "MAD": "🇲🇦", "ZAR": "🇿🇦", "MXN": "🇲🇽",
        "BRL": "🇧🇷", "INR": "🇮🇳", "KRW": "🇰🇷", "SGD": "🇸🇬",
        "HKD": "🇭🇰", "SEK": "🇸🇪", "NOK": "🇳🇴", "DKK": "🇩🇰"
    }

    def __init__(self, cache_service=None, db=None):
        self.cache = cache_service
        self.db = db
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        })
        self.cache_ttl = 900  # 15 minutes

    def get_events(self, target_date: date = None, impact: str = None, currency: str = None) -> List[Dict]:
        """
        Get economic events for a specific date.
        Combines data from multiple sources.
        """
        if target_date is None:
            target_date = date.today()

        cache_key = f"calendar_events_{target_date.isoformat()}"

        # Check cache first
        if self.cache:
            cached = self.cache.get(cache_key)
            if cached:
                events = cached
            else:
                events = self._fetch_all_events(target_date)
                self.cache.set(cache_key, events, ex=self.cache_ttl)
        else:
            events = self._fetch_all_events(target_date)

        # Apply filters
        if impact and impact != 'all':
            events = [e for e in events if e.get('impact', '').lower() == impact.lower()]
        if currency:
            events = [e for e in events if e.get('currency', '').upper() == currency.upper()]

        # Sort by time
        events.sort(key=lambda x: x.get('time', '23:59'))

        return events

    def get_week_events(self, impact: str = None) -> Dict[str, List[Dict]]:
        """
        Get events for the current week grouped by date.
        """
        today = date.today()
        start_of_week = today - timedelta(days=today.weekday())

        events_by_date = {}
        for i in range(7):
            current_date = start_of_week + timedelta(days=i)
            date_str = current_date.isoformat()
            events_by_date[date_str] = self.get_events(current_date, impact)

        return events_by_date

    def _fetch_all_events(self, target_date: date) -> List[Dict]:
        """
        Fetch events from all sources and merge.
        """
        events = []

        # Source 1: Try Investing.com
        try:
            investing_events = self._scrape_investing(target_date)
            events.extend(investing_events)
            logger.info(f"Fetched {len(investing_events)} events from Investing.com")
        except Exception as e:
            logger.warning(f"Investing.com scraping failed: {e}")

        # Source 2: Try Forex Factory if Investing failed
        if not events:
            try:
                ff_events = self._scrape_forex_factory(target_date)
                events.extend(ff_events)
                logger.info(f"Fetched {len(ff_events)} events from ForexFactory")
            except Exception as e:
                logger.warning(f"ForexFactory scraping failed: {e}")

        # Source 3: Add Moroccan events
        moroccan_events = self._get_moroccan_events(target_date)
        events.extend(moroccan_events)

        # Source 4: Load from database if available
        if self.db:
            db_events = self._load_from_database(target_date)
            events.extend(db_events)

        # Deduplicate events by (currency, event, time)
        seen = set()
        unique_events = []
        for event in events:
            key = (event.get('currency', ''), event.get('event', ''), event.get('time', ''))
            if key not in seen:
                seen.add(key)
                unique_events.append(event)

        return unique_events

    def _scrape_investing(self, target_date: date) -> List[Dict]:
        """
        Scrape economic calendar from Investing.com
        """
        events = []
        date_str = target_date.strftime('%Y-%m-%d')

        try:
            # Investing.com calendar with date filter
            url = f"{self.INVESTING_URL}?dateFrom={date_str}&dateTo={date_str}"
            response = self.session.get(url, timeout=15)

            if response.status_code != 200:
                return events

            soup = BeautifulSoup(response.text, 'html.parser')

            # Find event rows
            rows = soup.select('tr.js-event-item') or soup.select('tr[data-event-datetime]')

            for row in rows:
                try:
                    event = self._parse_investing_row(row, target_date)
                    if event:
                        events.append(event)
                except Exception as e:
                    logger.debug(f"Error parsing row: {e}")
                    continue

        except Exception as e:
            logger.error(f"Investing.com error: {e}")

        return events

    def _parse_investing_row(self, row, target_date: date) -> Optional[Dict]:
        """Parse a single event row from Investing.com"""
        try:
            # Time
            time_cell = row.select_one('td.first, td.time, [class*="time"]')
            time_text = time_cell.get_text(strip=True) if time_cell else "00:00"

            # Clean time format
            time_text = re.sub(r'[^\d:]', '', time_text)
            if not time_text:
                time_text = "00:00"

            # Currency/Country
            currency_cell = row.select_one('td.flagCur, td.country, [class*="flag"]')
            currency = "USD"
            if currency_cell:
                currency_text = currency_cell.get_text(strip=True).upper()
                # Extract 3-letter currency code
                match = re.search(r'([A-Z]{3})', currency_text)
                if match:
                    currency = match.group(1)

            # Event name
            event_cell = row.select_one('td.event, td[class*="event"], a[class*="event"]')
            event_name = event_cell.get_text(strip=True) if event_cell else "Unknown Event"

            # Impact
            impact = "low"
            impact_cell = row.select_one('[class*="sentiment"], [class*="impact"], [class*="bull"]')
            if impact_cell:
                impact_class = impact_cell.get('class', [])
                if isinstance(impact_class, list):
                    impact_class = ' '.join(impact_class)
                if 'high' in impact_class.lower() or 'bull3' in impact_class:
                    impact = "high"
                elif 'medium' in impact_class.lower() or 'bull2' in impact_class:
                    impact = "medium"

            # Actual, Forecast, Previous
            cells = row.select('td')
            actual = forecast = previous = None
            for cell in cells:
                cell_class = cell.get('class', [])
                if isinstance(cell_class, list):
                    cell_class = ' '.join(cell_class)
                text = cell.get_text(strip=True)
                if 'act' in cell_class.lower():
                    actual = text if text and text != '-' else None
                elif 'fore' in cell_class.lower():
                    forecast = text if text and text != '-' else None
                elif 'prev' in cell_class.lower():
                    previous = text if text and text != '-' else None

            return {
                "id": None,
                "date": target_date.isoformat(),
                "time": time_text[:5] if len(time_text) >= 5 else time_text,
                "currency": currency,
                "flag": self.CURRENCY_FLAGS.get(currency, "🏳️"),
                "event": event_name,
                "impact": impact,
                "actual": actual,
                "forecast": forecast,
                "previous": previous,
                "source": "investing"
            }
        except Exception as e:
            logger.debug(f"Parse error: {e}")
            return None

    def _scrape_forex_factory(self, target_date: date) -> List[Dict]:
        """
        Scrape economic calendar from ForexFactory (backup source)
        """
        events = []

        try:
            # ForexFactory uses different date format
            date_param = target_date.strftime('%b%d.%Y').lower()
            url = f"{self.FOREX_FACTORY_URL}?day={date_param}"

            response = self.session.get(url, timeout=15)
            if response.status_code != 200:
                return events

            soup = BeautifulSoup(response.text, 'html.parser')

            # Find event rows
            rows = soup.select('tr.calendar__row')

            for row in rows:
                try:
                    event = self._parse_ff_row(row, target_date)
                    if event:
                        events.append(event)
                except Exception:
                    continue

        except Exception as e:
            logger.error(f"ForexFactory error: {e}")

        return events

    def _parse_ff_row(self, row, target_date: date) -> Optional[Dict]:
        """Parse a single event row from ForexFactory"""
        try:
            # Time
            time_cell = row.select_one('td.calendar__time')
            time_text = time_cell.get_text(strip=True) if time_cell else "00:00"

            # Currency
            currency_cell = row.select_one('td.calendar__currency')
            currency = currency_cell.get_text(strip=True).upper() if currency_cell else "USD"

            # Event
            event_cell = row.select_one('td.calendar__event')
            event_name = event_cell.get_text(strip=True) if event_cell else None
            if not event_name:
                return None

            # Impact
            impact = "low"
            impact_cell = row.select_one('td.calendar__impact span')
            if impact_cell:
                impact_class = impact_cell.get('class', [])
                if isinstance(impact_class, list):
                    impact_class = ' '.join(impact_class)
                if 'high' in impact_class or 'red' in impact_class:
                    impact = "high"
                elif 'medium' in impact_class or 'orange' in impact_class:
                    impact = "medium"

            # Values
            actual_cell = row.select_one('td.calendar__actual')
            forecast_cell = row.select_one('td.calendar__forecast')
            previous_cell = row.select_one('td.calendar__previous')

            return {
                "id": None,
                "date": target_date.isoformat(),
                "time": time_text[:5] if time_text else "00:00",
                "currency": currency,
                "flag": self.CURRENCY_FLAGS.get(currency, "🏳️"),
                "event": event_name,
                "impact": impact,
                "actual": actual_cell.get_text(strip=True) if actual_cell else None,
                "forecast": forecast_cell.get_text(strip=True) if forecast_cell else None,
                "previous": previous_cell.get_text(strip=True) if previous_cell else None,
                "source": "forexfactory"
            }
        except Exception:
            return None

    def _get_moroccan_events(self, target_date: date) -> List[Dict]:
        """
        Generate Moroccan economic events based on typical release schedule.
        """
        events = []
        day = target_date.day
        month = target_date.month

        # Check quarterly events
        for event_def in MOROCCAN_EVENTS["quarterly"]:
            if month in event_def["months"] and day == event_def["typical_day"]:
                events.append({
                    "id": None,
                    "date": target_date.isoformat(),
                    "time": "10:00",
                    "currency": event_def["currency"],
                    "flag": "🇲🇦",
                    "event": event_def["event"],
                    "impact": event_def["impact"],
                    "actual": None,
                    "forecast": None,
                    "previous": None,
                    "source": "moroccan"
                })

        # Check monthly events
        for event_def in MOROCCAN_EVENTS["monthly"]:
            if day == event_def["typical_day"]:
                events.append({
                    "id": None,
                    "date": target_date.isoformat(),
                    "time": "10:00",
                    "currency": event_def["currency"],
                    "flag": "🇲🇦",
                    "event": event_def["event"],
                    "impact": event_def["impact"],
                    "actual": None,
                    "forecast": None,
                    "previous": None,
                    "source": "moroccan"
                })

        return events

    def _load_from_database(self, target_date: date) -> List[Dict]:
        """
        Load events from database (for manual entries or cached data).
        """
        # This will be implemented when syncing to database
        return []

    def sync_to_database(self, target_date: date = None):
        """
        Sync events to database for offline access and faster retrieval.
        """
        if not self.db:
            logger.warning("Database not configured for calendar sync")
            return

        if target_date is None:
            # Sync next 7 days
            for i in range(7):
                sync_date = date.today() + timedelta(days=i)
                self._sync_date_to_db(sync_date)
        else:
            self._sync_date_to_db(target_date)

    def _sync_date_to_db(self, target_date: date):
        """Sync a single date's events to database."""
        from models import EconomicEvent

        events = self._fetch_all_events(target_date)

        for event_data in events:
            # Check if exists
            existing = EconomicEvent.query.filter_by(
                event_date=target_date,
                currency=event_data.get('currency'),
                event=event_data.get('event')
            ).first()

            if existing:
                # Update actual value if changed
                if event_data.get('actual') and not existing.actual:
                    existing.actual = event_data['actual']
                    self.db.session.commit()
            else:
                # Create new event
                new_event = EconomicEvent(
                    event_date=target_date,
                    event_time=event_data.get('time', '00:00'),
                    currency=event_data.get('currency', 'USD'),
                    event=event_data.get('event', 'Unknown'),
                    impact=event_data.get('impact', 'low'),
                    forecast=event_data.get('forecast'),
                    previous=event_data.get('previous'),
                    actual=event_data.get('actual')
                )
                self.db.session.add(new_event)

        self.db.session.commit()
        logger.info(f"Synced {len(events)} events for {target_date}")

    def get_upcoming_high_impact(self, hours: int = 24) -> List[Dict]:
        """
        Get upcoming high-impact events within specified hours.
        """
        now = datetime.now()
        end_time = now + timedelta(hours=hours)

        events = []
        current_date = now.date()

        while current_date <= end_time.date():
            day_events = self.get_events(current_date, impact='high')
            for event in day_events:
                event_time_str = f"{current_date} {event.get('time', '00:00')}"
                try:
                    event_datetime = datetime.strptime(event_time_str, '%Y-%m-%d %H:%M')
                    if now <= event_datetime <= end_time:
                        event['datetime'] = event_datetime.isoformat()
                        events.append(event)
                except ValueError:
                    continue
            current_date += timedelta(days=1)

        return events


# Singleton instance
_calendar_service = None


def get_calendar_service(cache_service=None, db=None) -> CalendarService:
    """Get or create singleton CalendarService instance."""
    global _calendar_service
    if _calendar_service is None:
        _calendar_service = CalendarService(cache_service, db)
    return _calendar_service
