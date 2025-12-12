import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Divider,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Notifications,
  MarkEmailRead,
  Delete,
  Warning,
  Info,
  Email,
  Phone,
  SystemUpdate,
  CheckCircle,
} from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';
import axios from 'axios';

interface Notification {
  id: number;
  type: 'low_stock' | 'vendor_contact' | 'system';
  message: string;
  user_id: number;
  vendor_id?: number;
  inventory_id?: number;
  is_read: boolean;
  created_at: string;
  vendor_name?: string;
  inventory_name?: string;
}

const NotificationsPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'low_stock' | 'vendor_contact' | 'system'>('all');
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    let filtered = notifications;
    
    if (filter !== 'all') {
      if (filter === 'unread') {
        filtered = notifications.filter(n => !n.is_read);
      } else {
        filtered = notifications.filter(n => n.type === filter);
      }
    }
    
    setFilteredNotifications(filtered);
  }, [filter, notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <Warning sx={{ color: 'warning.main' }} />;
      case 'vendor_contact':
        return <Email sx={{ color: 'info.main' }} />;
      case 'system':
        return <SystemUpdate sx={{ color: 'primary.main' }} />;
      default:
        return <Notifications sx={{ color: 'action.active' }} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'warning';
      case 'vendor_contact':
        return 'info';
      case 'system':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mr: 2 }}>
            Notifications
          </Typography>
          <Badge badgeContent={unreadCount} color="error">
            <Notifications sx={{ color: 'action.active' }} />
          </Badge>
        </Box>
        <Button
          variant="outlined"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          startIcon={<MarkEmailRead />}
        >
          Mark All Read
        </Button>
      </Box>

      {/* Filter Buttons */}
      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={(e, value) => value && setFilter(value)}
        sx={{ mb: 3 }}
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="unread">Unread</ToggleButton>
        <ToggleButton value="low_stock">Low Stock</ToggleButton>
        <ToggleButton value="vendor_contact">Vendor Contact</ToggleButton>
        <ToggleButton value="system">System</ToggleButton>
      </ToggleButtonGroup>

      {/* Notifications List */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">Loading notifications...</Typography>
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%' }}>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    sx={{
                      px: 3,
                      py: 2,
                      bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getNotificationColor(notification.type)}.main` }}>
                        {getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: notification.is_read ? 'normal' : 'bold',
                              mr: 1,
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Chip
                            label={notification.type.replace('_', ' ').toUpperCase()}
                            size="small"
                            color={getNotificationColor(notification.type) as any}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {formatTime(notification.created_at)}
                          </Typography>
                          {notification.vendor_name && (
                            <Typography variant="body2" color="text.secondary">
                              Vendor: {notification.vendor_name}
                            </Typography>
                          )}
                          {notification.inventory_name && (
                            <Typography variant="body2" color="text.secondary">
                              Item: {notification.inventory_name}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!notification.is_read && (
                          <IconButton
                            size="small"
                            onClick={() => markAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <CheckCircle sx={{ color: 'success.main' }} />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteNotification(notification.id)}
                          title="Delete"
                        >
                          <Delete sx={{ color: 'error.main' }} />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default NotificationsPage;