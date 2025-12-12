import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  TextField,
  Button,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  Person,
  Email,
  Business,
  CalendarToday,
  Security,
  Notifications,
  Inventory,
  People,
  Edit,
  Save,
  Cancel,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
  });

  const stats = [
    { label: 'Items Managed', value: '42', icon: <Inventory /> },
    { label: 'Vendors Contacted', value: '8', icon: <People /> },
    { label: 'Notifications Received', value: '156', icon: <Notifications /> },
    { label: 'Account Type', value: user?.role || 'User', icon: <Security /> },
  ];

  const recentActivity = [
    { action: 'Updated inventory item', item: 'Laptop Dell XPS 13', time: '2 hours ago' },
    { action: 'Contacted vendor', item: 'TechSupply Co', time: '1 day ago' },
    { action: 'Created new item', item: 'Wireless Mouse Pro', time: '3 days ago' },
    { action: 'Received notification', item: 'Low stock alert', time: '1 week ago' },
  ];

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
    });
    setEditMode(false);
  };

  const handleSave = async () => {
    // Here you would typically make an API call to update the user profile
    try {
      // await axios.put('/api/auth/profile', formData);
      setEditMode(false);
      // Show success message
    } catch (error) {
      console.error('Error updating profile:', error);
      // Show error message
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 4 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  mr: 4,
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                {editMode ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: <Person sx={{ mr: 1 }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: <Email sx={{ mr: 1 }} />,
                        }}
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {user?.username}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                      {user?.email}
                    </Typography>
                    <Chip
                      icon={<Security />}
                      label={user?.role === 'admin' ? 'Administrator' : 'User'}
                      color={user?.role === 'admin' ? 'error' : 'primary'}
                      variant="outlined"
                    />
                  </>
                )}
              </Box>
              <Box sx={{ ml: 2 }}>
                {editMode ? (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleSave}
                      startIcon={<Save />}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCancel}
                      startIcon={<Cancel />}
                    >
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleEdit}
                    startIcon={<Edit />}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats Cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {stat.icon}
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        {stat.label}
                      </Typography>
                      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                        {stat.value}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Account Info */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Account Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText
                    primary="Username"
                    secondary={user?.username}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email"
                    secondary={user?.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText
                    primary="Member Since"
                    secondary="January 2025"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText
                    primary="Role"
                    secondary={user?.role === 'admin' ? 'Administrator' : 'User'}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Recent Activity
              </Typography>
              <List>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {activity.action.includes('inventory') || activity.action.includes('item') ? (
                            <Inventory />
                          ) : activity.action.includes('vendor') ? (
                            <People />
                          ) : activity.action.includes('notification') ? (
                            <Notifications />
                          ) : (
                            <Person />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.action}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {activity.item}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.time}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;