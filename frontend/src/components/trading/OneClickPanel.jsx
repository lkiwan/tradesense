import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  IconButton,
  Switch,
  FormControlLabel,
  TextField,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Collapse,
  Badge
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Settings,
  Close,
  Speed,
  Keyboard,
  VolumeUp,
  VolumeOff,
  ExpandMore,
  ExpandLess,
  Star,
  StarBorder,
  History,
  Refresh
} from '@mui/icons-material';
import api from '../../services/api';
import { useTradingHotkeys } from '../../hooks/useHotkeys';

const OneClickPanel = ({ symbol = 'EURUSD', currentPrice = 1.0850, challengeId }) => {
  // Settings state
  const [settings, setSettings] = useState({
    one_click_enabled: false,
    default_lot_size: 0.01,
    quick_lot_1: 0.01,
    quick_lot_2: 0.05,
    quick_lot_3: 0.1,
    quick_lot_4: 0.5,
    default_sl_enabled: true,
    default_sl_type: 'pips',
    default_sl_value: 20,
    default_tp_enabled: true,
    default_tp_type: 'pips',
    default_tp_value: 40,
    hotkey_buy: 'B',
    hotkey_sell: 'S',
    hotkey_close_all: 'X',
    sound_enabled: true,
    confirmation_required: true
  });

  // UI state
  const [selectedLot, setSelectedLot] = useState(0.01);
  const [showSettings, setShowSettings] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(null); // 'buy' | 'sell' | null
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [lastExecution, setLastExecution] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadFavorites();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/quick-trading/settings');
      if (response.data) {
        setSettings(response.data);
        setSelectedLot(parseFloat(response.data.default_lot_size) || 0.01);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const response = await api.get('/quick-trading/favorites');
      setFavorites(response.data || []);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await api.put('/quick-trading/settings', settings);
      setShowSettings(false);
      showSnackbar('Settings saved successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to save settings', 'error');
    }
  };

  const playSound = (type) => {
    if (!settings.sound_enabled) return;

    // Create audio context for feedback sounds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'buy') {
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
    } else if (type === 'sell') {
      oscillator.frequency.value = 400;
      oscillator.type = 'sine';
    } else if (type === 'error') {
      oscillator.frequency.value = 200;
      oscillator.type = 'square';
    }

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const executeOrder = useCallback(async (side) => {
    if (!settings.one_click_enabled) {
      showSnackbar('One-click trading is disabled. Enable it in settings.', 'warning');
      return;
    }

    if (settings.confirmation_required && !confirmDialog.open) {
      setConfirmDialog({ open: true, type: side });
      return;
    }

    setExecuting(side);
    setLoading(true);

    const startTime = Date.now();

    try {
      const orderData = {
        symbol,
        side,
        lot_size: selectedLot,
        challenge_id: challengeId,
        sl_pips: settings.default_sl_enabled ? settings.default_sl_value : null,
        tp_pips: settings.default_tp_enabled ? settings.default_tp_value : null
      };

      const response = await api.post('/quick-trading/execute', orderData);

      const executionTime = Date.now() - startTime;
      setLastExecution({
        side,
        lot: selectedLot,
        price: response.data.price || currentPrice,
        time: executionTime,
        timestamp: new Date()
      });

      playSound(side);
      showSnackbar(`${side.toUpperCase()} ${selectedLot} ${symbol} @ ${response.data.price || currentPrice} (${executionTime}ms)`, 'success');
    } catch (error) {
      playSound('error');
      showSnackbar(error.response?.data?.error || 'Order execution failed', 'error');
    } finally {
      setExecuting(null);
      setLoading(false);
      setConfirmDialog({ open: false, type: null });
    }
  }, [settings, selectedLot, symbol, challengeId, currentPrice, confirmDialog.open]);

  const closeAllPositions = useCallback(async () => {
    if (!settings.one_click_enabled) {
      showSnackbar('One-click trading is disabled', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/quick-trading/close-all', {
        challenge_id: challengeId,
        symbol: symbol
      });
      showSnackbar(`Closed ${response.data.closed_count} positions`, 'success');
    } catch (error) {
      showSnackbar('Failed to close positions', 'error');
    } finally {
      setLoading(false);
    }
  }, [settings.one_click_enabled, challengeId, symbol]);

  const reversePosition = async () => {
    if (!settings.one_click_enabled) {
      showSnackbar('One-click trading is disabled', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/quick-trading/reverse', {
        challenge_id: challengeId,
        symbol: symbol,
        lot_size: selectedLot
      });
      showSnackbar(`Position reversed: ${response.data.new_side}`, 'success');
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to reverse position', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (favorites.includes(symbol)) {
        await api.delete(`/api/quick-trading/favorites/${symbol}`);
        setFavorites(favorites.filter(s => s !== symbol));
      } else {
        await api.post('/quick-trading/favorites', { symbol });
        setFavorites([...favorites, symbol]);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // Hotkey handlers
  const handleBuy = useCallback(() => executeOrder('buy'), [executeOrder]);
  const handleSell = useCallback(() => executeOrder('sell'), [executeOrder]);
  const handleCloseAll = useCallback(() => closeAllPositions(), [closeAllPositions]);

  // Register hotkeys
  useTradingHotkeys({
    onBuy: handleBuy,
    onSell: handleSell,
    onCloseAll: handleCloseAll,
    enabled: settings.one_click_enabled,
    hotkeys: {
      buy: settings.hotkey_buy,
      sell: settings.hotkey_sell,
      closeAll: settings.hotkey_close_all,
      cancelOrders: 'C'
    }
  });

  const quickLots = [
    settings.quick_lot_1,
    settings.quick_lot_2,
    settings.quick_lot_3,
    settings.quick_lot_4
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Speed color="primary" />
          <Typography variant="h6" fontWeight="bold">
            One-Click Trading
          </Typography>
          <IconButton size="small" onClick={toggleFavorite}>
            {favorites.includes(symbol) ? (
              <Star sx={{ color: '#ffd700' }} />
            ) : (
              <StarBorder sx={{ color: 'grey.500' }} />
            )}
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Hotkeys Active">
            <Keyboard color={settings.one_click_enabled ? 'primary' : 'disabled'} fontSize="small" />
          </Tooltip>
          <IconButton size="small" onClick={() => setShowSettings(true)}>
            <Settings />
          </IconButton>
        </Box>
      </Box>

      {/* Enable Toggle */}
      <FormControlLabel
        control={
          <Switch
            checked={settings.one_click_enabled}
            onChange={(e) => setSettings({ ...settings, one_click_enabled: e.target.checked })}
            color="primary"
          />
        }
        label={
          <Typography variant="body2" color={settings.one_click_enabled ? 'primary' : 'text.secondary'}>
            {settings.one_click_enabled ? 'ONE-CLICK ENABLED' : 'One-Click Disabled'}
          </Typography>
        }
      />

      {/* Symbol & Price Display */}
      <Box sx={{ textAlign: 'center', my: 2 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          {symbol}
        </Typography>
        <Typography variant="h4" fontWeight="bold" sx={{ my: 1 }}>
          {currentPrice.toFixed(5)}
        </Typography>
      </Box>

      {/* Quick Lot Selection */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" gutterBottom>
          Lot Size
        </Typography>
        <ButtonGroup fullWidth variant="outlined" size="small" sx={{ mb: 1 }}>
          {quickLots.map((lot, index) => (
            <Button
              key={index}
              onClick={() => setSelectedLot(parseFloat(lot))}
              variant={selectedLot === parseFloat(lot) ? 'contained' : 'outlined'}
              sx={{
                fontWeight: selectedLot === parseFloat(lot) ? 'bold' : 'normal'
              }}
            >
              {lot}
            </Button>
          ))}
        </ButtonGroup>
        <TextField
          type="number"
          size="small"
          value={selectedLot}
          onChange={(e) => setSelectedLot(parseFloat(e.target.value) || 0.01)}
          inputProps={{ step: 0.01, min: 0.01 }}
          fullWidth
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Buy/Sell Buttons */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => executeOrder('buy')}
            disabled={!settings.one_click_enabled || loading}
            sx={{
              py: 3,
              bgcolor: '#00c853',
              '&:hover': { bgcolor: '#00a844' },
              '&:disabled': { bgcolor: 'grey.700' },
              fontSize: '1.2rem',
              fontWeight: 'bold',
              position: 'relative'
            }}
          >
            {executing === 'buy' ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <>
                <TrendingUp sx={{ mr: 1 }} />
                BUY
              </>
            )}
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: 4,
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: 0.7
              }}
            >
              [{settings.hotkey_buy}]
            </Typography>
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => executeOrder('sell')}
            disabled={!settings.one_click_enabled || loading}
            sx={{
              py: 3,
              bgcolor: '#ff1744',
              '&:hover': { bgcolor: '#d50000' },
              '&:disabled': { bgcolor: 'grey.700' },
              fontSize: '1.2rem',
              fontWeight: 'bold',
              position: 'relative'
            }}
          >
            {executing === 'sell' ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <>
                <TrendingDown sx={{ mr: 1 }} />
                SELL
              </>
            )}
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: 4,
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: 0.7
              }}
            >
              [{settings.hotkey_sell}]
            </Typography>
          </Button>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="outlined"
          color="warning"
          size="small"
          fullWidth
          onClick={closeAllPositions}
          disabled={!settings.one_click_enabled || loading}
          startIcon={<Close />}
        >
          Close All [{settings.hotkey_close_all}]
        </Button>
        <Button
          variant="outlined"
          color="info"
          size="small"
          fullWidth
          onClick={reversePosition}
          disabled={!settings.one_click_enabled || loading}
          startIcon={<Refresh />}
        >
          Reverse
        </Button>
      </Box>

      {/* Advanced Options */}
      <Button
        size="small"
        onClick={() => setShowAdvanced(!showAdvanced)}
        endIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
        sx={{ mb: 1 }}
      >
        Risk Settings
      </Button>
      <Collapse in={showAdvanced}>
        <Box sx={{ p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={settings.default_sl_enabled}
                    onChange={(e) => setSettings({ ...settings, default_sl_enabled: e.target.checked })}
                  />
                }
                label={<Typography variant="caption">SL</Typography>}
              />
              {settings.default_sl_enabled && (
                <TextField
                  size="small"
                  type="number"
                  value={settings.default_sl_value}
                  onChange={(e) => setSettings({ ...settings, default_sl_value: parseFloat(e.target.value) })}
                  InputProps={{
                    endAdornment: <Typography variant="caption">pips</Typography>
                  }}
                  sx={{ width: '100%' }}
                />
              )}
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={settings.default_tp_enabled}
                    onChange={(e) => setSettings({ ...settings, default_tp_enabled: e.target.checked })}
                  />
                }
                label={<Typography variant="caption">TP</Typography>}
              />
              {settings.default_tp_enabled && (
                <TextField
                  size="small"
                  type="number"
                  value={settings.default_tp_value}
                  onChange={(e) => setSettings({ ...settings, default_tp_value: parseFloat(e.target.value) })}
                  InputProps={{
                    endAdornment: <Typography variant="caption">pips</Typography>
                  }}
                  sx={{ width: '100%' }}
                />
              )}
            </Grid>
          </Grid>
        </Box>
      </Collapse>

      {/* Last Execution Info */}
      {lastExecution && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Last Execution:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Chip
              size="small"
              label={lastExecution.side.toUpperCase()}
              color={lastExecution.side === 'buy' ? 'success' : 'error'}
            />
            <Typography variant="body2">
              {lastExecution.lot} @ {lastExecution.price.toFixed(5)}
            </Typography>
            <Chip
              size="small"
              label={`${lastExecution.time}ms`}
              variant="outlined"
              sx={{ ml: 'auto' }}
            />
          </Box>
        </Box>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings />
            Quick Trading Settings
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Lot Sizes */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Quick Lot Sizes</Typography>
              <Grid container spacing={1}>
                {[1, 2, 3, 4].map((n) => (
                  <Grid item xs={3} key={n}>
                    <TextField
                      size="small"
                      label={`Lot ${n}`}
                      type="number"
                      value={settings[`quick_lot_${n}`]}
                      onChange={(e) => setSettings({ ...settings, [`quick_lot_${n}`]: parseFloat(e.target.value) })}
                      inputProps={{ step: 0.01, min: 0.01 }}
                      fullWidth
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Hotkeys */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Hotkeys</Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <TextField
                    size="small"
                    label="Buy"
                    value={settings.hotkey_buy}
                    onChange={(e) => setSettings({ ...settings, hotkey_buy: e.target.value.toUpperCase().charAt(0) })}
                    inputProps={{ maxLength: 1 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    size="small"
                    label="Sell"
                    value={settings.hotkey_sell}
                    onChange={(e) => setSettings({ ...settings, hotkey_sell: e.target.value.toUpperCase().charAt(0) })}
                    inputProps={{ maxLength: 1 }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    size="small"
                    label="Close All"
                    value={settings.hotkey_close_all}
                    onChange={(e) => setSettings({ ...settings, hotkey_close_all: e.target.value.toUpperCase().charAt(0) })}
                    inputProps={{ maxLength: 1 }}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Other Settings */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Preferences</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.sound_enabled}
                    onChange={(e) => setSettings({ ...settings, sound_enabled: e.target.checked })}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {settings.sound_enabled ? <VolumeUp /> : <VolumeOff />}
                    Sound Feedback
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.confirmation_required}
                    onChange={(e) => setSettings({ ...settings, confirmation_required: e.target.checked })}
                  />
                }
                label="Require Confirmation"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Cancel</Button>
          <Button onClick={saveSettings} variant="contained" color="primary">
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, type: null })}>
        <DialogTitle>
          Confirm {confirmDialog.type?.toUpperCase()} Order
        </DialogTitle>
        <DialogContent>
          <Typography>
            Execute {confirmDialog.type?.toUpperCase()} {selectedLot} {symbol}?
          </Typography>
          {settings.default_sl_enabled && (
            <Typography variant="body2" color="text.secondary">
              Stop Loss: {settings.default_sl_value} pips
            </Typography>
          )}
          {settings.default_tp_enabled && (
            <Typography variant="body2" color="text.secondary">
              Take Profit: {settings.default_tp_value} pips
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, type: null })}>
            Cancel
          </Button>
          <Button
            onClick={() => executeOrder(confirmDialog.type)}
            variant="contained"
            color={confirmDialog.type === 'buy' ? 'success' : 'error'}
          >
            Confirm {confirmDialog.type?.toUpperCase()}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default OneClickPanel;
