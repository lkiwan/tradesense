import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Chip,
  Divider,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Rating,
  Slider,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  LinearProgress
} from '@mui/material';
import {
  Add,
  Search,
  Star,
  StarBorder,
  Edit,
  Delete,
  TrendingUp,
  TrendingDown,
  CalendarMonth,
  BarChart,
  Download,
  FilterList,
  Refresh,
  Psychology,
  Timeline,
  EmojiEvents,
  Warning,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import api from '../../services/api';

// Constants
const EMOTIONS = [
  'confident', 'fearful', 'greedy', 'patient', 'impatient',
  'frustrated', 'calm', 'excited', 'anxious', 'neutral'
];

const SETUP_QUALITIES = ['A+', 'A', 'B', 'C', 'D'];

const EXECUTION_RATINGS = ['perfect', 'good', 'average', 'poor', 'terrible'];

const SESSIONS = ['asian', 'london', 'new_york', 'overlap'];

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];

const COMMON_TAGS = [
  'trend_following', 'breakout', 'pullback', 'reversal', 'scalp',
  'day_trade', 'swing', 'support_resistance', 'fibonacci', 'price_action'
];

const TradeJournalPage = () => {
  // State
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalEntries, setTotalEntries] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filters, setFilters] = useState({
    symbol: '',
    startDate: null,
    endDate: null,
    isWin: '',
    setupQuality: ''
  });

  // Form state
  const [formData, setFormData] = useState({
    symbol: '',
    trade_type: 'buy',
    lot_size: '',
    entry_price: '',
    exit_price: '',
    stop_loss: '',
    take_profit: '',
    profit_loss: '',
    profit_pips: '',
    trade_date: new Date().toISOString().split('T')[0],
    entry_time: '',
    exit_time: '',
    session: '',
    timeframe: '',
    setup_description: '',
    setup_quality: '',
    entry_reason: '',
    exit_reason: '',
    what_went_well: '',
    what_went_wrong: '',
    lessons_learned: '',
    execution_rating: '',
    followed_plan: null,
    emotion_before: '',
    emotion_during: '',
    emotion_after: '',
    confidence_level: 5,
    stress_level: 5,
    tags: [],
    strategy_name: '',
    is_mistake: false,
    notes: '',
    overall_rating: 0,
    is_favorite: false
  });

  useEffect(() => {
    loadEntries();
    loadAnalytics();
  }, [page, rowsPerPage, filters]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        per_page: rowsPerPage,
        ...filters.symbol && { symbol: filters.symbol },
        ...filters.startDate && { start_date: filters.startDate.toISOString().split('T')[0] },
        ...filters.endDate && { end_date: filters.endDate.toISOString().split('T')[0] },
        ...filters.isWin && { is_win: filters.isWin },
        ...filters.setupQuality && { setup_quality: filters.setupQuality }
      };

      const response = await api.get('/journal', { params });
      setEntries(response.data?.entries || []);
      setTotalEntries(response.data?.total || 0);
    } catch (error) {
      showSnackbar('Failed to load journal entries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/journal/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (entry = null) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        ...entry,
        trade_date: entry.trade_date || new Date().toISOString().split('T')[0],
        tags: entry.tags || [],
        confidence_level: entry.confidence_level || 5,
        stress_level: entry.stress_level || 5
      });
    } else {
      setEditingEntry(null);
      setFormData({
        symbol: '',
        trade_type: 'buy',
        lot_size: '',
        entry_price: '',
        exit_price: '',
        stop_loss: '',
        take_profit: '',
        profit_loss: '',
        profit_pips: '',
        trade_date: new Date().toISOString().split('T')[0],
        entry_time: '',
        exit_time: '',
        session: '',
        timeframe: '',
        setup_description: '',
        setup_quality: '',
        entry_reason: '',
        exit_reason: '',
        what_went_well: '',
        what_went_wrong: '',
        lessons_learned: '',
        execution_rating: '',
        followed_plan: null,
        emotion_before: '',
        emotion_during: '',
        emotion_after: '',
        confidence_level: 5,
        stress_level: 5,
        tags: [],
        strategy_name: '',
        is_mistake: false,
        notes: '',
        overall_rating: 0,
        is_favorite: false
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.symbol.trim()) {
      showSnackbar('Symbol is required', 'error');
      return;
    }

    try {
      const payload = {
        ...formData,
        lot_size: formData.lot_size ? parseFloat(formData.lot_size) : null,
        entry_price: formData.entry_price ? parseFloat(formData.entry_price) : null,
        exit_price: formData.exit_price ? parseFloat(formData.exit_price) : null,
        stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
        take_profit: formData.take_profit ? parseFloat(formData.take_profit) : null,
        profit_loss: formData.profit_loss ? parseFloat(formData.profit_loss) : null,
        profit_pips: formData.profit_pips ? parseFloat(formData.profit_pips) : null
      };

      if (editingEntry) {
        await api.put(`/api/journal/${editingEntry.id}`, payload);
        showSnackbar('Journal entry updated');
      } else {
        await api.post('/journal', payload);
        showSnackbar('Journal entry created');
      }
      setDialogOpen(false);
      loadEntries();
      loadAnalytics();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to save entry', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await api.delete(`/api/journal/${deleteConfirm.id}`);
      showSnackbar('Entry deleted');
      setDeleteConfirm(null);
      loadEntries();
      loadAnalytics();
    } catch (error) {
      showSnackbar('Failed to delete entry', 'error');
    }
  };

  const handleToggleFavorite = async (entry) => {
    try {
      await api.post(`/api/journal/${entry.id}/toggle-favorite`);
      loadEntries();
    } catch (error) {
      showSnackbar('Failed to update', 'error');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/journal/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trade_journal_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSnackbar('Journal exported successfully');
    } catch (error) {
      showSnackbar('Failed to export', 'error');
    }
  };

  const getPnLColor = (pnl) => {
    if (!pnl) return 'text.secondary';
    return parseFloat(pnl) >= 0 ? 'success.main' : 'error.main';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Psychology sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Trade Journal
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Document, analyze, and learn from your trades
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<Download />} onClick={handleExportCSV}>
              Export
            </Button>
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
              New Entry
            </Button>
          </Box>
        </Box>

        {/* Analytics Cards */}
        {analytics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight="bold">{analytics.total_entries}</Typography>
                  <Typography variant="caption">Total Entries</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight="bold">{analytics.win_rate}%</Typography>
                  <Typography variant="caption">Win Rate</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ background: analytics.total_pnl >= 0
                ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" fontWeight="bold">
                    ${Math.abs(analytics.total_pnl).toLocaleString()}
                  </Typography>
                  <Typography variant="caption">Total P&L</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <EmojiEvents />
                    <Typography variant="h4" fontWeight="bold">{analytics.streak?.current || 0}</Typography>
                  </Box>
                  <Typography variant="caption">Win Streak</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Journal Entries" icon={<Timeline />} iconPosition="start" />
            <Tab label="Analytics" icon={<BarChart />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && (
          <>
            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Symbol"
                    value={filters.symbol}
                    onChange={(e) => setFilters({ ...filters, symbol: e.target.value.toUpperCase() })}
                    placeholder="EURUSD"
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <DatePicker
                    label="From"
                    value={filters.startDate}
                    onChange={(date) => setFilters({ ...filters, startDate: date })}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <DatePicker
                    label="To"
                    value={filters.endDate}
                    onChange={(date) => setFilters({ ...filters, endDate: date })}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Result</InputLabel>
                    <Select
                      value={filters.isWin}
                      label="Result"
                      onChange={(e) => setFilters({ ...filters, isWin: e.target.value })}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="true">Winners</MenuItem>
                      <MenuItem value="false">Losers</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6} sm={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Quality</InputLabel>
                    <Select
                      value={filters.setupQuality}
                      label="Quality"
                      onChange={(e) => setFilters({ ...filters, setupQuality: e.target.value })}
                    >
                      <MenuItem value="">All</MenuItem>
                      {SETUP_QUALITIES.map(q => (
                        <MenuItem key={q} value={q}>{q}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={1}>
                  <IconButton onClick={() => setFilters({ symbol: '', startDate: null, endDate: null, isWin: '', setupQuality: '' })}>
                    <Refresh />
                  </IconButton>
                </Grid>
              </Grid>
            </Paper>

            {/* Entries Table */}
            <Paper>
              {loading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <CircularProgress />
                </Box>
              ) : entries.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <Psychology sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No journal entries yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Start documenting your trades to improve your performance
                  </Typography>
                  <Button variant="contained" onClick={() => handleOpenDialog()}>
                    Create First Entry
                  </Button>
                </Box>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Symbol</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">P&L</TableCell>
                          <TableCell>Setup</TableCell>
                          <TableCell>Execution</TableCell>
                          <TableCell>Tags</TableCell>
                          <TableCell>Rating</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {entries.map((entry) => (
                          <TableRow key={entry.id} hover>
                            <TableCell>{entry.trade_date}</TableCell>
                            <TableCell>
                              <Typography fontWeight="bold">{entry.symbol}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={entry.trade_type?.toUpperCase()}
                                color={entry.trade_type === 'buy' ? 'success' : 'error'}
                                icon={entry.trade_type === 'buy' ? <TrendingUp /> : <TrendingDown />}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                fontWeight="bold"
                                color={getPnLColor(entry.profit_loss)}
                              >
                                {entry.profit_loss !== null
                                  ? `$${parseFloat(entry.profit_loss).toFixed(2)}`
                                  : '-'}
                              </Typography>
                              {entry.profit_pips && (
                                <Typography variant="caption" color="text.secondary">
                                  {entry.profit_pips} pips
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {entry.setup_quality && (
                                <Chip
                                  size="small"
                                  label={entry.setup_quality}
                                  color={entry.setup_quality === 'A+' || entry.setup_quality === 'A' ? 'success' : 'default'}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {entry.execution_rating && (
                                <Chip size="small" label={entry.execution_rating} variant="outlined" />
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 150 }}>
                                {(entry.tags || []).slice(0, 2).map(tag => (
                                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                                ))}
                                {(entry.tags || []).length > 2 && (
                                  <Chip label={`+${entry.tags.length - 2}`} size="small" />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Rating value={entry.overall_rating || 0} size="small" readOnly />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => handleToggleFavorite(entry)}>
                                {entry.is_favorite ? <Star sx={{ color: '#ffd700' }} /> : <StarBorder />}
                              </IconButton>
                              <IconButton size="small" onClick={() => handleOpenDialog(entry)}>
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => setDeleteConfirm(entry)} color="error">
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={totalEntries}
                    page={page}
                    onPageChange={(e, p) => setPage(p)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
                      setPage(0);
                    }}
                  />
                </>
              )}
            </Paper>
          </>
        )}

        {tabValue === 1 && analytics && (
          <Grid container spacing={3}>
            {/* Performance by Setup Quality */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Performance by Setup Quality</Typography>
                {Object.entries(analytics.by_setup_quality || {}).map(([quality, data]) => (
                  <Box key={quality} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography>{quality} Setup</Typography>
                      <Typography>
                        {data.wins}/{data.count} wins ({data.count > 0 ? Math.round((data.wins/data.count)*100) : 0}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={data.count > 0 ? (data.wins/data.count)*100 : 0}
                      color={data.pnl >= 0 ? 'success' : 'error'}
                    />
                    <Typography variant="caption" color={data.pnl >= 0 ? 'success.main' : 'error.main'}>
                      P&L: ${data.pnl.toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>

            {/* Performance by Emotion */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Performance by Pre-Trade Emotion</Typography>
                {Object.entries(analytics.by_emotion || {}).slice(0, 5).map(([emotion, data]) => (
                  <Box key={emotion} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ textTransform: 'capitalize' }}>{emotion}</Typography>
                      <Typography>
                        {data.wins}/{data.count} wins
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={data.count > 0 ? (data.wins/data.count)*100 : 0}
                      color={data.pnl >= 0 ? 'success' : 'error'}
                    />
                    <Typography variant="caption" color={data.pnl >= 0 ? 'success.main' : 'error.main'}>
                      P&L: ${data.pnl.toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>

            {/* Top Tags */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Top Strategy Tags</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(analytics.by_tag || {}).map(([tag, data]) => (
                    <Chip
                      key={tag}
                      label={`${tag} (${data.count})`}
                      color={data.pnl >= 0 ? 'success' : 'error'}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* By Day of Week */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Performance by Day</Typography>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                  const data = analytics.by_day?.[i] || { count: 0, wins: 0, pnl: 0 };
                  if (data.count === 0) return null;
                  return (
                    <Box key={day} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography sx={{ width: 40 }}>{day}</Typography>
                      <Box sx={{ flexGrow: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={data.count > 0 ? (data.wins/data.count)*100 : 0}
                          color={data.pnl >= 0 ? 'success' : 'error'}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ width: 80, textAlign: 'right' }}>
                        {data.count} trades
                      </Typography>
                    </Box>
                  );
                })}
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
          </DialogTitle>
          <DialogContent dividers sx={{ maxHeight: '70vh' }}>
            <Grid container spacing={2}>
              {/* Trade Details */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>Trade Details</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Symbol"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  required
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={formData.trade_type}
                    label="Type"
                    onChange={(e) => setFormData({ ...formData, trade_type: e.target.value })}
                  >
                    <MenuItem value="buy">Buy</MenuItem>
                    <MenuItem value="sell">Sell</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Lot Size"
                  type="number"
                  value={formData.lot_size}
                  onChange={(e) => setFormData({ ...formData, lot_size: e.target.value })}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={formData.trade_date}
                  onChange={(e) => setFormData({ ...formData, trade_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Entry Price"
                  type="number"
                  value={formData.entry_price}
                  onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                  inputProps={{ step: 0.00001 }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Exit Price"
                  type="number"
                  value={formData.exit_price}
                  onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
                  inputProps={{ step: 0.00001 }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="P/L ($)"
                  type="number"
                  value={formData.profit_loss}
                  onChange={(e) => setFormData({ ...formData, profit_loss: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="P/L (pips)"
                  type="number"
                  value={formData.profit_pips}
                  onChange={(e) => setFormData({ ...formData, profit_pips: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

              {/* Analysis */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>Analysis</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Setup Quality</InputLabel>
                  <Select
                    value={formData.setup_quality}
                    label="Setup Quality"
                    onChange={(e) => setFormData({ ...formData, setup_quality: e.target.value })}
                  >
                    <MenuItem value="">-</MenuItem>
                    {SETUP_QUALITIES.map(q => <MenuItem key={q} value={q}>{q}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Execution</InputLabel>
                  <Select
                    value={formData.execution_rating}
                    label="Execution"
                    onChange={(e) => setFormData({ ...formData, execution_rating: e.target.value })}
                  >
                    <MenuItem value="">-</MenuItem>
                    {EXECUTION_RATINGS.map(r => <MenuItem key={r} value={r} sx={{ textTransform: 'capitalize' }}>{r}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Session</InputLabel>
                  <Select
                    value={formData.session}
                    label="Session"
                    onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                  >
                    <MenuItem value="">-</MenuItem>
                    {SESSIONS.map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Timeframe</InputLabel>
                  <Select
                    value={formData.timeframe}
                    label="Timeframe"
                    onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                  >
                    <MenuItem value="">-</MenuItem>
                    {TIMEFRAMES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Setup Description"
                  value={formData.setup_description}
                  onChange={(e) => setFormData({ ...formData, setup_description: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Lessons Learned"
                  value={formData.lessons_learned}
                  onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

              {/* Psychology */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>Psychology</Typography>
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Emotion Before</InputLabel>
                  <Select
                    value={formData.emotion_before}
                    label="Emotion Before"
                    onChange={(e) => setFormData({ ...formData, emotion_before: e.target.value })}
                  >
                    <MenuItem value="">-</MenuItem>
                    {EMOTIONS.map(e => <MenuItem key={e} value={e} sx={{ textTransform: 'capitalize' }}>{e}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Emotion During</InputLabel>
                  <Select
                    value={formData.emotion_during}
                    label="Emotion During"
                    onChange={(e) => setFormData({ ...formData, emotion_during: e.target.value })}
                  >
                    <MenuItem value="">-</MenuItem>
                    {EMOTIONS.map(e => <MenuItem key={e} value={e} sx={{ textTransform: 'capitalize' }}>{e}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Emotion After</InputLabel>
                  <Select
                    value={formData.emotion_after}
                    label="Emotion After"
                    onChange={(e) => setFormData({ ...formData, emotion_after: e.target.value })}
                  >
                    <MenuItem value="">-</MenuItem>
                    {EMOTIONS.map(e => <MenuItem key={e} value={e} sx={{ textTransform: 'capitalize' }}>{e}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption">Confidence Level: {formData.confidence_level}</Typography>
                <Slider
                  value={formData.confidence_level}
                  onChange={(e, v) => setFormData({ ...formData, confidence_level: v })}
                  min={1}
                  max={10}
                  marks
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption">Stress Level: {formData.stress_level}</Typography>
                <Slider
                  value={formData.stress_level}
                  onChange={(e, v) => setFormData({ ...formData, stress_level: v })}
                  min={1}
                  max={10}
                  marks
                />
              </Grid>

              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

              {/* Tags & Rating */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="primary" gutterBottom>Tags & Rating</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  multiple
                  freeSolo
                  options={COMMON_TAGS}
                  value={formData.tags}
                  onChange={(e, v) => setFormData({ ...formData, tags: v })}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} />
                    ))
                  }
                  renderInput={(params) => <TextField {...params} label="Tags" placeholder="Add tags" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Strategy Name"
                  value={formData.strategy_name}
                  onChange={(e) => setFormData({ ...formData, strategy_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption">Overall Rating</Typography>
                <Rating
                  value={formData.overall_rating}
                  onChange={(e, v) => setFormData({ ...formData, overall_rating: v })}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_mistake}
                      onChange={(e) => setFormData({ ...formData, is_mistake: e.target.checked })}
                    />
                  }
                  label="Mark as Mistake"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained">
              {editingEntry ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
          <DialogTitle>Delete Entry</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default TradeJournalPage;
