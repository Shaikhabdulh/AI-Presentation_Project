import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  Inventory,
  People,
  Notifications,
  Warning,
  TrendingUp,
  TrendingDown,
  MoreVert,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  totalVendors: number;
  unreadNotifications: number;
}

interface LowStockItem {
  id: number;
  name: string;
  quantity: number;
  min_threshold: number;
  unit: string;
}

interface RecentActivity {
  id: number;
  message: string;
  type: string;
  created_at: string;
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalItems: 0,
    lowStockItems: 0,
    totalVendors: 0,
    unreadNotifications: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Sample data for charts
  const inventoryTrend = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 700 },
    { name: 'Jun', value: 900 },
  ];

  const categoryData = [
    { name: 'Electronics', value: 35, color: '#3b82f6' },
    { name: 'Accessories', value: 25, color: '#10b981' },
    { name: 'Furniture', value: 20, color: '#f59e0b' },
    { name: 'Consumables', value: 20, color: '#ef4444' },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard summary
      const [summaryResponse, lowStockResponse, activityResponse] = await Promise.all([
        axios.get('/api/inventory/dashboard-summary'),
        axios.get('/api/inventory/low-stock'),
        axios.get('/api/notifications/recent'),
      ]);

      setStats(summaryResponse.data);
      setLowStockItems(lowStockResponse.data);
      setRecentActivity(activityResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <Card sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-2px)' } }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                )}
                <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'}>
                  {trend > 0 ? '+' : ''}{trend}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Items"
            value={stats.totalItems}
            icon={<Inventory />}
            color="primary.main"
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={stats.lowStockItems}
            icon={<Warning />}
            color="warning.main"
            trend={-8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Vendors"
            value={stats.totalVendors}
            icon={<People />}
            color="success.main"
            trend={5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Unread Notifications"
            value={stats.unreadNotifications}
            icon={<Notifications />}
            color="error.main"
          />
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Inventory Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={inventoryTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Categories Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {categoryData.map((category) => (
                  <Box key={category.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: category.color,
                        borderRadius: '50%',
                        mr: 1,
                      }}
                    />
                    <Typography variant="body2">
                      {category.name}: {category.value}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Low Stock Items */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Low Stock Items
                </Typography>
                <Chip
                  label={`${lowStockItems.length} items`}
                  color="warning"
                  size="small"
                />
              </Box>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {lowStockItems.map((item) => {
                  const stockPercentage = (item.quantity / item.min_threshold) * 100;
                  return (
                    <ListItem key={item.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <Warning />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={item.name}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {item.quantity} / {item.min_threshold} {item.unit}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(stockPercentage, 100)}
                                color={stockPercentage < 50 ? 'error' : 'warning'}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Recent Activity
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {recentActivity.map((activity) => (
                  <ListItem key={activity.id} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Notifications />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.message}
                      secondary={new Date(activity.created_at).toLocaleString()}
                    />
                    <Chip
                      label={activity.type}
                      size="small"
                      variant="outlined"
                      color={activity.type === 'low_stock' ? 'warning' : 'info'}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;