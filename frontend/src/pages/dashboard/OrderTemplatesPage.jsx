import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
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
  Divider,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add,
  Search,
  Star,
  StarBorder,
  Edit,
  Delete,
  ContentCopy,
  MoreVert,
  TrendingUp,
  TrendingDown,
  Security,
  FlashOn,
  Timeline,
  GpsFixed,
  PlayArrow,
  Settings,
  FilterList
} from '@mui/icons-material';
import api from '../../services/api';

// Icon mapping
const ICONS = {
  template: Settings,
  zap: FlashOn,
  'trending-up': TrendingUp,
  activity: Timeline,
  shield: Security,
  target: GpsFixed
};

const OrderTemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0); // 0: All, 1: Favorites
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTemplate, setMenuTemplate] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    icon: 'template',
    symbol: '',
    symbol_locked: false,
    order_type: 'market',
    order_side: null,
    position_sizing: {
      lot_size: 0.1,
      use_risk_based_sizing: false,
      risk_percent: 1
    },
    stop_loss: {
      enabled: true,
      type: 'pips',
      value: 20
    },
    take_profit: {
      enabled: true,
      type: 'pips',
      value: 40
    },
    trailing_stop: {
      enabled: false,
      type: 'pips',
      value: 15,
      activation: 20
    },
    break_even: {
      enabled: false,
      trigger: 15,
      offset: 1
    },
    is_favorite: false
  });

  useEffect(() => {
    loadTemplates();
  }, [tabValue]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params = tabValue === 1 ? { favorites: 'true' } : {};
      const response = await api.get('/templates', { params });
      setTemplates(response.data?.templates || []);
    } catch (error) {
      showSnackbar('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        description: template.description || '',
        color: template.color,
        icon: template.icon,
        symbol: template.symbol || '',
        symbol_locked: template.symbol_locked,
        order_type: template.order_type,
        order_side: template.order_side,
        position_sizing: template.position_sizing || {
          lot_size: 0.1,
          use_risk_based_sizing: false,
          risk_percent: 1
        },
        stop_loss: template.stop_loss || { enabled: true, type: 'pips', value: 20 },
        take_profit: template.take_profit || { enabled: true, type: 'pips', value: 40 },
        trailing_stop: template.trailing_stop || { enabled: false, type: 'pips', value: 15, activation: 20 },
        break_even: template.break_even || { enabled: false, trigger: 15, offset: 1 },
        is_favorite: template.is_favorite
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        description: '',
        color: '#6366f1',
        icon: 'template',
        symbol: '',
        symbol_locked: false,
        order_type: 'market',
        order_side: null,
        position_sizing: { lot_size: 0.1, use_risk_based_sizing: false, risk_percent: 1 },
        stop_loss: { enabled: true, type: 'pips', value: 20 },
        take_profit: { enabled: true, type: 'pips', value: 40 },
        trailing_stop: { enabled: false, type: 'pips', value: 15, activation: 20 },
        break_even: { enabled: false, trigger: 15, offset: 1 },
        is_favorite: false
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showSnackbar('Template name is required', 'error');
      return;
    }

    try {
      if (editingTemplate) {
        await api.put(`/api/templates/${editingTemplate.id}`, formData);
        showSnackbar('Template updated successfully');
      } else {
        await api.post('/templates', formData);
        showSnackbar('Template created successfully');
      }
      handleCloseDialog();
      loadTemplates();
    } catch (error) {
      showSnackbar(error.response?.data?.error || 'Failed to save template', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await api.delete(`/api/templates/${deleteConfirm.id}`);
      showSnackbar('Template deleted');
      setDeleteConfirm(null);
      loadTemplates();
    } catch (error) {
      showSnackbar('Failed to delete template', 'error');
    }
  };

  const handleToggleFavorite = async (template) => {
    try {
      await api.post(`/api/templates/${template.id}/toggle-favorite`);
      loadTemplates();
    } catch (error) {
      showSnackbar('Failed to update favorite', 'error');
    }
  };

  const handleDuplicate = async (template) => {
    try {
      await api.post(`/api/templates/${template.id}/duplicate`);
      showSnackbar('Template duplicated');
      loadTemplates();
    } catch (error) {
      showSnackbar('Failed to duplicate template', 'error');
    }
    setAnchorEl(null);
  };

  const handleUseTemplate = async (template) => {
    try {
      await api.post(`/api/templates/${template.id}/use`);
      showSnackbar(`Template "${template.name}" loaded - Ready to trade!`);
    } catch (error) {
      showSnackbar('Failed to use template', 'error');
    }
  };

  const handleInitDefaults = async () => {
    try {
      const response = await api.post('/templates/init-defaults');
      showSnackbar(response.data.message);
      loadTemplates();
    } catch (error) {
      showSnackbar('Failed to create default templates', 'error');
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (t.symbol && t.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getIconComponent = (iconName) => {
    const IconComponent = ICONS[iconName] || Settings;
    return IconComponent;
  };

  const COLORS = [
    '#6366f1', '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b',
    '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#06b6d4'
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Settings sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Order Templates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Save and reuse your favorite order configurations
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Template
        </Button>
      </Box>

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="All Templates" />
              <Tab
                label={
                  <Badge badgeContent={templates.filter(t => t.is_favorite).length} color="primary">
                    Favorites
                  </Badge>
                }
              />
            </Tabs>
          </Grid>
        </Grid>
      </Paper>

      {/* Templates Grid */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredTemplates.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Settings sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {templates.length === 0
              ? 'Create your first template or load default templates to get started.'
              : 'No templates match your search criteria.'}
          </Typography>
          {templates.length === 0 && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" onClick={() => handleOpenDialog()}>
                Create Template
              </Button>
              <Button variant="outlined" onClick={handleInitDefaults}>
                Load Defaults
              </Button>
            </Box>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredTemplates.map((template) => {
            const IconComponent = getIconComponent(template.icon);
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderTop: `4px solid ${template.color}`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: template.color + '20',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <IconComponent sx={{ color: template.color }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold" noWrap>
                            {template.name}
                          </Typography>
                          {template.symbol && (
                            <Chip size="small" label={template.symbol} sx={{ height: 20 }} />
                          )}
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleFavorite(template)}
                      >
                        {template.is_favorite ? (
                          <Star sx={{ color: '#ffd700' }} />
                        ) : (
                          <StarBorder />
                        )}
                      </IconButton>
                    </Box>

                    {template.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} noWrap>
                        {template.description}
                      </Typography>
                    )}

                    {/* Quick Info */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {template.position_sizing?.lot_size && (
                        <Chip
                          size="small"
                          label={`${template.position_sizing.lot_size} Lots`}
                          variant="outlined"
                        />
                      )}
                      {template.stop_loss?.enabled && (
                        <Chip
                          size="small"
                          label={`SL: ${template.stop_loss.value}`}
                          color="error"
                          variant="outlined"
                        />
                      )}
                      {template.take_profit?.enabled && (
                        <Chip
                          size="small"
                          label={template.take_profit.type === 'rr_ratio'
                            ? `RR: 1:${template.take_profit.rr_ratio}`
                            : `TP: ${template.take_profit.value}`}
                          color="success"
                          variant="outlined"
                        />
                      )}
                      {template.trailing_stop?.enabled && (
                        <Chip size="small" label="Trail" color="info" variant="outlined" />
                      )}
                    </Box>

                    {/* Stats */}
                    {template.stats && template.stats.times_used > 0 && (
                      <Box sx={{ display: 'flex', gap: 2, fontSize: '0.75rem', color: 'text.secondary' }}>
                        <span>Used: {template.stats.times_used}x</span>
                        {template.stats.win_rate !== null && (
                          <span>Win: {template.stats.win_rate}%</span>
                        )}
                      </Box>
                    )}
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use
                    </Button>
                    <Box>
                      <IconButton size="small" onClick={() => handleOpenDialog(template)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          setAnchorEl(e.currentTarget);
                          setMenuTemplate(template);
                        }}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => menuTemplate && handleDuplicate(menuTemplate)}>
          <ListItemIcon><ContentCopy fontSize="small" /></ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteConfirm(menuTemplate);
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Basic Info */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Symbol (optional)"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                placeholder="EURUSD"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="caption" color="text.secondary">Color</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                {COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: color,
                      borderRadius: 1,
                      cursor: 'pointer',
                      border: formData.color === color ? '3px solid white' : 'none',
                      boxShadow: formData.color === color ? `0 0 0 2px ${color}` : 'none'
                    }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Position Sizing
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Lot Size"
                value={formData.position_sizing.lot_size}
                onChange={(e) => setFormData({
                  ...formData,
                  position_sizing: { ...formData.position_sizing, lot_size: parseFloat(e.target.value) }
                })}
                inputProps={{ step: 0.01, min: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.position_sizing.use_risk_based_sizing}
                    onChange={(e) => setFormData({
                      ...formData,
                      position_sizing: { ...formData.position_sizing, use_risk_based_sizing: e.target.checked }
                    })}
                  />
                }
                label="Use Risk-Based Sizing"
              />
            </Grid>
            {formData.position_sizing.use_risk_based_sizing && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Risk % Per Trade"
                  value={formData.position_sizing.risk_percent}
                  onChange={(e) => setFormData({
                    ...formData,
                    position_sizing: { ...formData.position_sizing, risk_percent: parseFloat(e.target.value) }
                  })}
                  inputProps={{ step: 0.5, min: 0.1, max: 10 }}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Stop Loss & Take Profit
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.stop_loss.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      stop_loss: { ...formData.stop_loss, enabled: e.target.checked }
                    })}
                  />
                }
                label="Stop Loss"
              />
              {formData.stop_loss.enabled && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={formData.stop_loss.type}
                      onChange={(e) => setFormData({
                        ...formData,
                        stop_loss: { ...formData.stop_loss, type: e.target.value }
                      })}
                    >
                      <MenuItem value="pips">Pips</MenuItem>
                      <MenuItem value="points">Points</MenuItem>
                      <MenuItem value="percent">%</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    type="number"
                    value={formData.stop_loss.value}
                    onChange={(e) => setFormData({
                      ...formData,
                      stop_loss: { ...formData.stop_loss, value: parseFloat(e.target.value) }
                    })}
                    sx={{ width: 100 }}
                  />
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.take_profit.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      take_profit: { ...formData.take_profit, enabled: e.target.checked }
                    })}
                  />
                }
                label="Take Profit"
              />
              {formData.take_profit.enabled && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={formData.take_profit.type}
                      onChange={(e) => setFormData({
                        ...formData,
                        take_profit: { ...formData.take_profit, type: e.target.value }
                      })}
                    >
                      <MenuItem value="pips">Pips</MenuItem>
                      <MenuItem value="points">Points</MenuItem>
                      <MenuItem value="rr_ratio">R:R Ratio</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    type="number"
                    value={formData.take_profit.type === 'rr_ratio'
                      ? (formData.take_profit.rr_ratio || 2)
                      : formData.take_profit.value}
                    onChange={(e) => {
                      if (formData.take_profit.type === 'rr_ratio') {
                        setFormData({
                          ...formData,
                          take_profit: { ...formData.take_profit, rr_ratio: parseFloat(e.target.value) }
                        });
                      } else {
                        setFormData({
                          ...formData,
                          take_profit: { ...formData.take_profit, value: parseFloat(e.target.value) }
                        });
                      }
                    }}
                    sx={{ width: 100 }}
                  />
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Advanced Features
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.trailing_stop.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      trailing_stop: { ...formData.trailing_stop, enabled: e.target.checked }
                    })}
                  />
                }
                label="Trailing Stop"
              />
              {formData.trailing_stop.enabled && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField
                    size="small"
                    type="number"
                    label="Trail (pips)"
                    value={formData.trailing_stop.value}
                    onChange={(e) => setFormData({
                      ...formData,
                      trailing_stop: { ...formData.trailing_stop, value: parseFloat(e.target.value) }
                    })}
                    sx={{ width: 100 }}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="Activate at"
                    value={formData.trailing_stop.activation}
                    onChange={(e) => setFormData({
                      ...formData,
                      trailing_stop: { ...formData.trailing_stop, activation: parseFloat(e.target.value) }
                    })}
                    sx={{ width: 100 }}
                  />
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.break_even.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      break_even: { ...formData.break_even, enabled: e.target.checked }
                    })}
                  />
                }
                label="Break Even"
              />
              {formData.break_even.enabled && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <TextField
                    size="small"
                    type="number"
                    label="Trigger (pips)"
                    value={formData.break_even.trigger}
                    onChange={(e) => setFormData({
                      ...formData,
                      break_even: { ...formData.break_even, trigger: parseFloat(e.target.value) }
                    })}
                    sx={{ width: 100 }}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="Offset"
                    value={formData.break_even.offset}
                    onChange={(e) => setFormData({
                      ...formData,
                      break_even: { ...formData.break_even, offset: parseFloat(e.target.value) }
                    })}
                    sx={{ width: 100 }}
                  />
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_favorite}
                    onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                  />
                }
                label="Add to Favorites"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={Boolean(deleteConfirm)} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
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
    </Container>
  );
};

export default OrderTemplatesPage;
