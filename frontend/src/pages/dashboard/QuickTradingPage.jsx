import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Speed,
  TrendingUp,
  TrendingDown,
  AccessTime,
  ShowChart,
  Refresh,
  Timeline,
  Keyboard
} from '@mui/icons-material';
import { OneClickPanel } from '../../components/trading';
import api from '../../services/api';

const SYMBOLS = [
  { name: 'EURUSD', type: 'forex' },
  { name: 'GBPUSD', type: 'forex' },
  { name: 'USDJPY', type: 'forex' },
  { name: 'XAUUSD', type: 'commodity' },
  { name: 'BTCUSD', type: 'crypto' },
  { name: 'US30', type: 'index' },
  { name: 'NAS100', type: 'index' }
];

const QuickTradingPage = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('EURUSD');
  const [currentPrice, setCurrentPrice] = useState(1.0850);
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [stats, setStats] = useState({
    total_orders: 0,
    avg_execution_time: 0,
    win_rate: 0,
    today_orders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenges();
    loadExecutionHistory();
    loadStats();

    // Simulate price updates (would be WebSocket in production)
    const priceInterval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 0.0010;
        return parseFloat((prev + change).toFixed(5));
      });
    }, 1000);

    return () => clearInterval(priceInterval);
  }, []);

  const loadChallenges = async () => {
    try {
      const response = await api.get('/challenges/my-challenges');
      const activeChallenge = response.data?.find(c => c.status === 'active');
      setChallenges(response.data || []);
      if (activeChallenge) {
        setSelectedChallenge(activeChallenge.id);
      }
    } catch (error) {
      console.error('Failed to load challenges:', error);
    }
  };

  const loadExecutionHistory = async () => {
    try {
      const response = await api.get('/quick-trading/history', {
        params: { limit: 10 }
      });
      setExecutionHistory(response.data?.orders || []);
    } catch (error) {
      console.error('Failed to load execution history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/quick-trading/stats');
      if (response.data) {
        setStats({
          total_orders: response.data.total_orders || 0,
          avg_execution_time: response.data.avg_execution_time_ms || 0,
          win_rate: 0, // Could be calculated from trade history
          today_orders: response.data.total_orders || 0
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Speed sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Quick Trading
            </Typography>
            <Typography variant="body2" color="text.secondary">
              One-click order execution with hotkey support
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Symbol</InputLabel>
            <Select
              value={selectedSymbol}
              label="Symbol"
              onChange={(e) => setSelectedSymbol(e.target.value)}
            >
              {SYMBOLS.map(s => (
                <MenuItem key={s.name} value={s.name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShowChart fontSize="small" />
                    {s.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {challenges.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Account</InputLabel>
              <Select
                value={selectedChallenge || ''}
                label="Account"
                onChange={(e) => setSelectedChallenge(e.target.value)}
              >
                {challenges.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.model_name} - ${c.account_size?.toLocaleString()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>

      {/* Hotkey Info */}
      <Alert
        severity="info"
        icon={<Keyboard />}
        sx={{ mb: 3 }}
      >
        <Typography variant="body2">
          <strong>Hotkeys:</strong> Press <Chip size="small" label="B" /> to Buy,
          <Chip size="small" label="S" sx={{ mx: 0.5 }} /> to Sell,
          <Chip size="small" label="X" sx={{ mx: 0.5 }} /> to Close All.
          Enable One-Click Trading to activate hotkeys.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* One-Click Panel */}
        <Grid item xs={12} md={5} lg={4}>
          <OneClickPanel
            symbol={selectedSymbol}
            currentPrice={currentPrice}
            challengeId={selectedChallenge}
          />
        </Grid>

        {/* Stats & History */}
        <Grid item xs={12} md={7} lg={8}>
          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Timeline sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total_orders}
                  </Typography>
                  <Typography variant="caption">Total Orders</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <AccessTime sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {formatTime(stats.avg_execution_time)}
                  </Typography>
                  <Typography variant="caption">Avg Execution</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.win_rate}%
                  </Typography>
                  <Typography variant="caption">Win Rate</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Speed sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {stats.today_orders}
                  </Typography>
                  <Typography variant="caption">Today's Orders</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Execution History */}
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Recent Executions
              </Typography>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={loadExecutionHistory}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : executionHistory.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Symbol</TableCell>
                      <TableCell>Side</TableCell>
                      <TableCell align="right">Lot Size</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Execution</TableCell>
                      <TableCell>Method</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {executionHistory.map((order, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="caption">
                            {formatDate(order.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {order.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={order.side?.toUpperCase()}
                            color={order.side === 'buy' ? 'success' : 'error'}
                            icon={order.side === 'buy' ? <TrendingUp /> : <TrendingDown />}
                          />
                        </TableCell>
                        <TableCell align="right">{order.lot_size}</TableCell>
                        <TableCell align="right">
                          {parseFloat(order.entry_price).toFixed(5)}
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={formatTime(order.execution_time_ms)}
                            variant="outlined"
                            color={order.execution_time_ms < 100 ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {order.executed_via === 'hotkey' ? '⌨️ Hotkey' : '🖱️ Click'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No execution history yet. Start trading with one-click!
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Tips */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Pro Tips
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  • Enable one-click trading for instant order execution
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Configure default SL/TP in settings to auto-apply risk management
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  • Use hotkeys for fastest execution during volatile markets
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Quick lot buttons let you switch position sizes instantly
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default QuickTradingPage;
