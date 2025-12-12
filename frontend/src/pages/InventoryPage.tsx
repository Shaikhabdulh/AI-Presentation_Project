import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Fab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Warning,
  CheckCircle,
  Inventory,
} from '@mui/icons-material';
import axios from 'axios';

interface InventoryItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
  min_threshold: number;
  unit: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    min_threshold: 10,
    unit: 'units',
    category: '',
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    const filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/inventory');
      setItems(response.data);
      setFilteredItems(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setFormData({
      name: '',
      description: '',
      quantity: 0,
      min_threshold: 10,
      unit: 'units',
      category: '',
    });
    setOpenDialog(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      min_threshold: item.min_threshold,
      unit: item.unit,
      category: item.category,
    });
    setOpenDialog(true);
  };

  const handleDeleteItem = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/api/inventory/${id}`);
        fetchInventory();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedItem) {
        await axios.put(`/api/inventory/${selectedItem.id}`, formData);
      } else {
        await axios.post('/api/inventory', formData);
      }
      setOpenDialog(false);
      fetchInventory();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const getStockStatus = (quantity: number, min_threshold: number) => {
    const percentage = (quantity / min_threshold) * 100;
    if (percentage < 50) return { status: 'low', color: 'error' };
    if (percentage < 80) return { status: 'medium', color: 'warning' };
    return { status: 'good', color: 'success' };
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Inventory Management
        </Typography>
        <TextField
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1 }} />,
          }}
          size="small"
          sx={{ width: 300 }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="center">Quantity</TableCell>
              <TableCell align="center">Min Threshold</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => {
              const stockStatus = getStockStatus(item.quantity, item.min_threshold);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Inventory sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.category} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {item.quantity} {item.unit}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {item.min_threshold} {item.unit}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={stockStatus.status === 'low' ? <Warning /> : <CheckCircle />}
                      label={stockStatus.status.charAt(0).toUpperCase() + stockStatus.status.slice(1)}
                      color={stockStatus.color as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleEditItem(item)} color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteItem(item.id)} color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleAddItem}
      >
        <Add />
      </Fab>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Edit Inventory Item' : 'Add New Item'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Item Name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              margin="normal"
              fullWidth
              multiline
              rows={3}
              label="Description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Min Threshold"
                  name="min_threshold"
                  type="number"
                  value={formData.min_threshold}
                  onChange={(e) => setFormData({ ...formData, min_threshold: parseInt(e.target.value) || 0 })}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Unit"
                  name="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedItem ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryPage;