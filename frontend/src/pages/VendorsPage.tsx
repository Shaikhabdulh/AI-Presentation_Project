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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
  Business,
  Email,
  Phone,
  LocationOn,
  Person,
  Inventory,
} from '@mui/icons-material';
import axios from 'axios';

interface Vendor {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  specialty: string;
  created_at: string;
  updated_at: string;
}

interface InventoryItem {
  id: number;
  name: string;
  category: string;
}

const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [openContactDialog, setOpenContactDialog] = useState(false);
  const [contactVendor, setContactVendor] = useState<Vendor | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [contactMessage, setContactMessage] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    specialty: '',
  });

  useEffect(() => {
    fetchVendors();
    fetchInventoryItems();
  }, []);

  useEffect(() => {
    const filtered = vendors.filter(vendor =>
      vendor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredVendors(filtered);
  }, [searchTerm, vendors]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/vendors');
      setVendors(response.data);
      setFilteredVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await axios.get('/api/inventory');
      setInventoryItems(response.data);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    }
  };

  const handleAddVendor = () => {
    setSelectedVendor(null);
    setFormData({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      specialty: '',
    });
    setOpenDialog(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      company_name: vendor.company_name,
      contact_person: vendor.contact_person,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      specialty: vendor.specialty,
    });
    setOpenDialog(true);
  };

  const handleDeleteVendor = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await axios.delete(`/api/vendors/${id}`);
        fetchVendors();
      } catch (error) {
        console.error('Error deleting vendor:', error);
      }
    }
  };

  const handleContactVendor = (vendor: Vendor) => {
    setContactVendor(vendor);
    setSelectedItems([]);
    setContactMessage('');
    setOpenContactDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedVendor) {
        await axios.put(`/api/vendors/${selectedVendor.id}`, formData);
      } else {
        await axios.post('/api/vendors', formData);
      }
      setOpenDialog(false);
      fetchVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!contactVendor) return;
      
      const contactData = {
        vendor_id: contactVendor.id,
        inventory_ids: selectedItems,
        message: contactMessage,
        contact_type: 'email',
      };
      
      await axios.post('/api/vendors/contact', contactData);
      setOpenContactDialog(false);
      
      // Show success message
      alert('Contact message sent successfully!');
    } catch (error) {
      console.error('Error contacting vendor:', error);
    }
  };

  const handleItemToggle = (itemId: number) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Vendor Management
        </Typography>
        <TextField
          placeholder="Search vendors..."
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
              <TableCell>Company</TableCell>
              <TableCell>Contact Person</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Specialty</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVendors.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {vendor.company_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vendor.address}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1, color: 'action.active' }} />
                    {vendor.contact_person}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Email sx={{ mr: 1, color: 'action.active' }} />
                    {vendor.email}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Phone sx={{ mr: 1, color: 'action.active' }} />
                    {vendor.phone}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={vendor.specialty}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleContactVendor(vendor)}
                    sx={{ mr: 1 }}
                  >
                    Contact
                  </Button>
                  <IconButton onClick={() => handleEditVendor(vendor)} color="primary">
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteVendor(vendor.id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleAddVendor}
      >
        <Add />
      </Fab>

      {/* Add/Edit Vendor Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Company Name"
              name="company_name"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Contact Person"
              name="contact_person"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <TextField
              margin="normal"
              fullWidth
              multiline
              rows={3}
              label="Address"
              name="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Specialty"
              name="specialty"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedVendor ? 'Update' : 'Add'} Vendor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contact Vendor Dialog */}
      <Dialog open={openContactDialog} onClose={() => setOpenContactDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Contact {contactVendor?.company_name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select Items to Discuss:
            </Typography>
            <List sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
              {inventoryItems.map((item) => (
                <ListItem
                  key={item.id}
                  button
                  onClick={() => handleItemToggle(item.id)}
                  selected={selectedItems.includes(item.id)}
                >
                  <ListItemIcon>
                    <Inventory />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    secondary={item.category}
                  />
                </ListItem>
              ))}
            </List>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Message:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Enter your message here..."
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenContactDialog(false)}>Cancel</Button>
          <Button
            onClick={handleContactSubmit}
            variant="contained"
            color="primary"
            disabled={selectedItems.length === 0 || !contactMessage.trim()}
          >
            Send Message
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorsPage;