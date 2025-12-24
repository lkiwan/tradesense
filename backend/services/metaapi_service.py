"""
MetaAPI Service for TradeSense

Provides MT4/MT5 integration through MetaAPI.cloud service.
Handles connection management, trade sync, and execution.

MetaAPI Documentation: https://metaapi.cloud/docs/client/
"""

import os
import logging
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any, List
from cryptography.fernet import Fernet

logger = logging.getLogger(__name__)

# Check if MetaAPI is available
try:
    from metaapi_cloud_sdk import MetaApi
    METAAPI_AVAILABLE = True
except ImportError:
    METAAPI_AVAILABLE = False
    logger.warning("MetaAPI SDK not installed. Running in mock mode. Install with: pip install metaapi-cloud-sdk")


class MetaAPIService:
    """
    Service for MT4/MT5 integration via MetaAPI.

    Features:
    - Account provisioning and connection
    - Real-time account info sync
    - Trade execution
    - Position and history sync
    - Credential encryption
    """

    def __init__(self):
        self.api_token = os.getenv('METAAPI_TOKEN')
        self.encryption_key = os.getenv('MT_ENCRYPTION_KEY')
        self.mock_mode = not METAAPI_AVAILABLE or not self.api_token

        if self.mock_mode:
            logger.info("MetaAPI running in MOCK mode")
        else:
            logger.info("MetaAPI initialized with token")

        # Initialize encryption
        if self.encryption_key:
            self.fernet = Fernet(self.encryption_key.encode() if isinstance(self.encryption_key, str) else self.encryption_key)
        else:
            # Generate a key for development (should be set in production)
            self.fernet = Fernet(Fernet.generate_key())
            logger.warning("Using auto-generated encryption key. Set MT_ENCRYPTION_KEY in production!")

        self._api = None
        self._accounts_cache = {}

    async def _get_api(self):
        """Get or create MetaAPI instance"""
        if self.mock_mode:
            return None

        if self._api is None:
            self._api = MetaApi(self.api_token)
        return self._api

    def encrypt_password(self, password: str) -> bytes:
        """Encrypt MT password for storage"""
        return self.fernet.encrypt(password.encode())

    def decrypt_password(self, encrypted: bytes) -> str:
        """Decrypt stored MT password"""
        return self.fernet.decrypt(encrypted).decode()

    async def create_account(
        self,
        login: str,
        password: str,
        server: str,
        platform: str = 'mt5',
        broker_name: str = None
    ) -> Dict[str, Any]:
        """
        Create a MetaAPI account for MT4/MT5 connection.

        Args:
            login: MT account login
            password: MT account password
            server: MT broker server
            platform: 'mt4' or 'mt5'
            broker_name: Optional broker name for display

        Returns:
            Dictionary with account info including metaapi_account_id
        """
        if self.mock_mode:
            # Return mock response for development
            mock_account_id = f"mock_{login}_{server.replace('.', '_')}"
            return {
                'success': True,
                'metaapi_account_id': mock_account_id,
                'deploy_state': 'DEPLOYED',
                'connection_status': 'CONNECTED',
                'account_info': {
                    'name': f'Demo Account {login}',
                    'currency': 'USD',
                    'leverage': 100,
                    'balance': 10000.00,
                    'equity': 10000.00,
                    'margin': 0,
                    'freeMargin': 10000.00
                }
            }

        try:
            api = await self._get_api()

            # Create account in MetaAPI
            account = await api.metatrader_account_api.create_account({
                'name': f'TradeSense_{login}',
                'type': 'cloud',
                'login': login,
                'password': password,
                'server': server,
                'platform': platform,
                'magic': 0,
                'manualTrades': True,
                'quoteStreamingIntervalInSeconds': 2.5,
                'reliability': 'regular'
            })

            # Wait for deployment
            logger.info(f"Deploying MetaAPI account {account.id}...")
            await account.deploy()
            await account.wait_deployed()

            # Wait for connection
            logger.info(f"Connecting to MT account...")
            connection = account.get_rpc_connection()
            await connection.connect()
            await connection.wait_synchronized()

            # Get account information
            account_info = await connection.get_account_information()

            return {
                'success': True,
                'metaapi_account_id': account.id,
                'deploy_state': account.state,
                'connection_status': account.connection_status,
                'account_info': {
                    'name': account_info.get('name'),
                    'currency': account_info.get('currency'),
                    'leverage': account_info.get('leverage'),
                    'balance': account_info.get('balance'),
                    'equity': account_info.get('equity'),
                    'margin': account_info.get('margin'),
                    'freeMargin': account_info.get('freeMargin')
                }
            }

        except Exception as e:
            logger.error(f"Error creating MetaAPI account: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def connect_account(self, metaapi_account_id: str) -> Dict[str, Any]:
        """
        Connect to an existing MetaAPI account.

        Args:
            metaapi_account_id: The MetaAPI account ID

        Returns:
            Dictionary with connection status and account info
        """
        if self.mock_mode:
            return {
                'success': True,
                'connection_status': 'CONNECTED',
                'account_info': {
                    'name': 'Mock Account',
                    'currency': 'USD',
                    'leverage': 100,
                    'balance': 10000.00,
                    'equity': 10000.00,
                    'margin': 0,
                    'freeMargin': 10000.00
                }
            }

        try:
            api = await self._get_api()
            account = await api.metatrader_account_api.get_account(metaapi_account_id)

            # Deploy if needed
            if account.state != 'DEPLOYED':
                await account.deploy()
                await account.wait_deployed()

            # Connect
            connection = account.get_rpc_connection()
            await connection.connect()
            await connection.wait_synchronized()

            # Get account info
            account_info = await connection.get_account_information()

            return {
                'success': True,
                'connection_status': account.connection_status,
                'account_info': {
                    'name': account_info.get('name'),
                    'currency': account_info.get('currency'),
                    'leverage': account_info.get('leverage'),
                    'balance': account_info.get('balance'),
                    'equity': account_info.get('equity'),
                    'margin': account_info.get('margin'),
                    'freeMargin': account_info.get('freeMargin')
                }
            }

        except Exception as e:
            logger.error(f"Error connecting to MetaAPI account: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def disconnect_account(self, metaapi_account_id: str) -> Dict[str, Any]:
        """
        Disconnect and undeploy a MetaAPI account.

        Args:
            metaapi_account_id: The MetaAPI account ID

        Returns:
            Dictionary with success status
        """
        if self.mock_mode:
            return {'success': True, 'message': 'Account disconnected (mock)'}

        try:
            api = await self._get_api()
            account = await api.metatrader_account_api.get_account(metaapi_account_id)

            # Undeploy to stop billing
            await account.undeploy()

            return {
                'success': True,
                'message': 'Account disconnected and undeployed'
            }

        except Exception as e:
            logger.error(f"Error disconnecting MetaAPI account: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def get_account_info(self, metaapi_account_id: str) -> Dict[str, Any]:
        """
        Get current account information.

        Args:
            metaapi_account_id: The MetaAPI account ID

        Returns:
            Dictionary with account details
        """
        if self.mock_mode:
            import random
            # Simulate some balance changes
            base_balance = 10000.00
            pnl = random.uniform(-200, 500)
            return {
                'success': True,
                'account_info': {
                    'name': 'Mock Account',
                    'currency': 'USD',
                    'leverage': 100,
                    'balance': base_balance,
                    'equity': base_balance + pnl,
                    'margin': abs(pnl) * 0.1 if pnl != 0 else 0,
                    'freeMargin': base_balance + pnl - (abs(pnl) * 0.1 if pnl != 0 else 0)
                }
            }

        try:
            api = await self._get_api()
            account = await api.metatrader_account_api.get_account(metaapi_account_id)

            connection = account.get_rpc_connection()
            await connection.connect()
            await connection.wait_synchronized()

            account_info = await connection.get_account_information()

            return {
                'success': True,
                'account_info': {
                    'name': account_info.get('name'),
                    'currency': account_info.get('currency'),
                    'leverage': account_info.get('leverage'),
                    'balance': account_info.get('balance'),
                    'equity': account_info.get('equity'),
                    'margin': account_info.get('margin'),
                    'freeMargin': account_info.get('freeMargin')
                }
            }

        except Exception as e:
            logger.error(f"Error getting account info: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def get_positions(self, metaapi_account_id: str) -> Dict[str, Any]:
        """
        Get current open positions.

        Args:
            metaapi_account_id: The MetaAPI account ID

        Returns:
            Dictionary with positions list
        """
        if self.mock_mode:
            return {
                'success': True,
                'positions': [
                    {
                        'id': '12345',
                        'symbol': 'EURUSD',
                        'type': 'POSITION_TYPE_BUY',
                        'volume': 0.1,
                        'openPrice': 1.0850,
                        'currentPrice': 1.0865,
                        'profit': 15.00,
                        'swap': 0,
                        'commission': -0.70,
                        'openTime': datetime.utcnow().isoformat()
                    }
                ]
            }

        try:
            api = await self._get_api()
            account = await api.metatrader_account_api.get_account(metaapi_account_id)

            connection = account.get_rpc_connection()
            await connection.connect()
            await connection.wait_synchronized()

            positions = await connection.get_positions()

            return {
                'success': True,
                'positions': positions
            }

        except Exception as e:
            logger.error(f"Error getting positions: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def get_history(
        self,
        metaapi_account_id: str,
        start_time: datetime = None,
        end_time: datetime = None
    ) -> Dict[str, Any]:
        """
        Get trading history.

        Args:
            metaapi_account_id: The MetaAPI account ID
            start_time: Start of history period
            end_time: End of history period

        Returns:
            Dictionary with deals/orders history
        """
        if self.mock_mode:
            return {
                'success': True,
                'deals': [
                    {
                        'id': '1001',
                        'symbol': 'EURUSD',
                        'type': 'DEAL_TYPE_BUY',
                        'volume': 0.1,
                        'price': 1.0850,
                        'profit': 25.00,
                        'time': datetime.utcnow().isoformat()
                    }
                ]
            }

        try:
            api = await self._get_api()
            account = await api.metatrader_account_api.get_account(metaapi_account_id)

            connection = account.get_rpc_connection()
            await connection.connect()
            await connection.wait_synchronized()

            # Get deals history
            start = start_time or datetime(2020, 1, 1)
            end = end_time or datetime.utcnow()

            deals = await connection.get_deals_by_time_range(start, end)

            return {
                'success': True,
                'deals': deals
            }

        except Exception as e:
            logger.error(f"Error getting history: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def execute_trade(
        self,
        metaapi_account_id: str,
        symbol: str,
        side: str,
        volume: float,
        stop_loss: float = None,
        take_profit: float = None,
        comment: str = None
    ) -> Dict[str, Any]:
        """
        Execute a market order.

        Args:
            metaapi_account_id: The MetaAPI account ID
            symbol: Trading symbol (e.g., 'EURUSD')
            side: 'buy' or 'sell'
            volume: Lot size
            stop_loss: Optional SL price
            take_profit: Optional TP price
            comment: Optional order comment

        Returns:
            Dictionary with order result
        """
        if self.mock_mode:
            import random
            order_id = str(random.randint(100000, 999999))
            price = 1.0850 if 'USD' in symbol else 100.00

            return {
                'success': True,
                'order_id': order_id,
                'position_id': order_id,
                'execution_price': price,
                'volume': volume,
                'symbol': symbol,
                'side': side,
                'message': f'Mock {side} order executed'
            }

        try:
            api = await self._get_api()
            account = await api.metatrader_account_api.get_account(metaapi_account_id)

            connection = account.get_rpc_connection()
            await connection.connect()
            await connection.wait_synchronized()

            # Execute order
            if side.lower() == 'buy':
                result = await connection.create_market_buy_order(
                    symbol,
                    volume,
                    stop_loss,
                    take_profit,
                    {'comment': comment or 'TradeSense'}
                )
            else:
                result = await connection.create_market_sell_order(
                    symbol,
                    volume,
                    stop_loss,
                    take_profit,
                    {'comment': comment or 'TradeSense'}
                )

            return {
                'success': True,
                'order_id': result.get('orderId'),
                'position_id': result.get('positionId'),
                'execution_price': result.get('executionPrice'),
                'volume': volume,
                'symbol': symbol,
                'side': side
            }

        except Exception as e:
            logger.error(f"Error executing trade: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def close_position(
        self,
        metaapi_account_id: str,
        position_id: str,
        volume: float = None
    ) -> Dict[str, Any]:
        """
        Close an open position.

        Args:
            metaapi_account_id: The MetaAPI account ID
            position_id: Position ID to close
            volume: Optional partial close volume

        Returns:
            Dictionary with close result
        """
        if self.mock_mode:
            return {
                'success': True,
                'position_id': position_id,
                'profit': 25.00,
                'message': 'Mock position closed'
            }

        try:
            api = await self._get_api()
            account = await api.metatrader_account_api.get_account(metaapi_account_id)

            connection = account.get_rpc_connection()
            await connection.connect()
            await connection.wait_synchronized()

            # Close position
            if volume:
                result = await connection.close_position_partially(position_id, volume)
            else:
                result = await connection.close_position(position_id)

            return {
                'success': True,
                'position_id': position_id,
                'profit': result.get('profit'),
                'message': 'Position closed successfully'
            }

        except Exception as e:
            logger.error(f"Error closing position: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def modify_position(
        self,
        metaapi_account_id: str,
        position_id: str,
        stop_loss: float = None,
        take_profit: float = None
    ) -> Dict[str, Any]:
        """
        Modify an open position's SL/TP.

        Args:
            metaapi_account_id: The MetaAPI account ID
            position_id: Position ID to modify
            stop_loss: New stop loss price
            take_profit: New take profit price

        Returns:
            Dictionary with modification result
        """
        if self.mock_mode:
            return {
                'success': True,
                'position_id': position_id,
                'stop_loss': stop_loss,
                'take_profit': take_profit,
                'message': 'Mock position modified'
            }

        try:
            api = await self._get_api()
            account = await api.metatrader_account_api.get_account(metaapi_account_id)

            connection = account.get_rpc_connection()
            await connection.connect()
            await connection.wait_synchronized()

            result = await connection.modify_position(position_id, stop_loss, take_profit)

            return {
                'success': True,
                'position_id': position_id,
                'stop_loss': stop_loss,
                'take_profit': take_profit,
                'message': 'Position modified successfully'
            }

        except Exception as e:
            logger.error(f"Error modifying position: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def delete_account(self, metaapi_account_id: str) -> Dict[str, Any]:
        """
        Delete a MetaAPI account (permanently remove).

        Args:
            metaapi_account_id: The MetaAPI account ID

        Returns:
            Dictionary with deletion result
        """
        if self.mock_mode:
            return {'success': True, 'message': 'Account deleted (mock)'}

        try:
            api = await self._get_api()
            account = await api.metatrader_account_api.get_account(metaapi_account_id)

            # Undeploy first
            if account.state == 'DEPLOYED':
                await account.undeploy()
                await account.wait_undeployed()

            # Delete
            await account.remove()

            return {
                'success': True,
                'message': 'Account deleted successfully'
            }

        except Exception as e:
            logger.error(f"Error deleting MetaAPI account: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# Singleton instance
metaapi_service = MetaAPIService()


# Helper function to run async code from sync context
def run_async(coro):
    """Run async coroutine from synchronous code"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(coro)
