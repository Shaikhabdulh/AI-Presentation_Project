import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  Dashboard,
  Inventory,
  People,
  Notifications,
  Security,
  Speed,
  Storage,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const features = [
    {
      icon: <Dashboard sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Real-time Dashboard',
      description: 'Monitor your inventory levels, track stock movements, and get insights at a glance with our intuitive dashboard.',
    },
    {
      icon: <Notifications sx={{ fontSize: 40, color: 'warning.main' }} />,
      title: 'Smart Notifications',
      description: 'Get instant alerts when inventory runs low, items expire, or when vendors need attention.',
    },
    {
      icon: <People sx={{ fontSize: 40, color: 'success.main' }} />,
      title: 'Vendor Management',
      description: 'Manage vendor relationships, track communications, and streamline procurement processes.',
    },
    {
      icon: <Security sx={{ fontSize: 40, color: 'error.main' }} />,
      title: 'Secure & Scalable',
      description: 'Built with modern security practices and microservices architecture for enterprise scalability.',
    },
  ];

  const stats = [
    { label: 'Active Items', value: '1,234', icon: <Inventory /> },
    { label: 'Low Stock Alerts', value: '23', icon: <Notifications /> },
    { label: 'Active Vendors', value: '45', icon: <People /> },
    { label: 'System Uptime', value: '99.9%', icon: <TrendingUp /> },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Navigation */}
      <AppBar position="fixed" sx={{ backgroundColor: 'primary.main' }}>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <Dashboard />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Inventory Management System
          </Typography>
          {user ? (
            <Button color="inherit" onClick={() => navigate('/app/dashboard')}>
              Go to Dashboard
            </Button>
          ) : (
            <Box>
              <Button color="inherit" onClick={() => navigate('/login')} sx={{ mr: 1 }}>
                Login
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          pt: 12,
          pb: 8,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Modern Inventory Management
              </Typography>
              <Typography variant="h5" component="h2" gutterBottom sx={{ opacity: 0.9 }}>
                Streamline your inventory operations with real-time tracking,
                smart notifications, and seamless vendor management.
              </Typography>
              <Box sx={{ mt: 4 }}>
                {user ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/app/dashboard')}
                    sx={{ mr: 2, px: 4, py: 1.5 }}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/register')}
                      sx={{ mr: 2, px: 4, py: 1.5 }}
                    >
                      Get Started
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/login')}
                      sx={{ px: 4, py: 1.5, borderColor: 'white', color: 'white' }}
                    >
                      Login
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 2,
                  p: 4,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Live System Stats
                </Typography>
                <Grid container spacing={2}>
                  {stats.map((stat, index) => (
                    <Grid item xs={6} key={index}>
                      <Box sx={{ textAlign: 'center' }}>
                        <IconButton sx={{ color: 'white' }}>
                          {stat.icon}
                        </IconButton>
                        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, backgroundColor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" textAlign="center" gutterBottom sx={{ fontWeight: 'bold', mb: 6 }}>
            Why Choose Our System?
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ height: '100%', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-4px)' } }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 8, backgroundColor: 'primary.main', color: 'white' }}>
        <Container maxWidth="md" textAlign="center">
          <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Ready to Transform Your Inventory Management?
          </Typography>
          <Typography variant="h6" component="p" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of businesses already using our system to streamline their operations.
          </Typography>
          {user ? (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/app/dashboard')}
              sx={{ px: 6, py: 2, backgroundColor: 'white', color: 'primary.main' }}
            >
              Access Dashboard
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ px: 6, py: 2, backgroundColor: 'white', color: 'primary.main' }}
            >
              Start Free Trial
            </Button>
          )}
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, backgroundColor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg" textAlign="center">
          <Typography variant="body2" color="text.secondary">
            © 2025 Inventory Management System. Built with modern microservices architecture.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;