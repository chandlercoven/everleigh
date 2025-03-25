import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import ThemeToggle from './ThemeToggle';

const Header = ({ darkMode, setDarkMode }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSignIn = () => {
    signIn();
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
    handleCloseUserMenu();
  };

  const navigateTo = (path) => {
    router.push(path);
    if (mobileOpen) setMobileOpen(false);
    if (anchorElUser) handleCloseUserMenu();
  };

  const drawerWidth = 240;
  
  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography
        variant="h6"
        sx={{
          my: 2,
          fontWeight: 'bold',
          color: 'primary.main'
        }}
      >
        Everleigh
      </Typography>
      <Divider />
      <List>
        {session && (
          <ListItem disablePadding>
            <ListItemButton 
              sx={{ textAlign: 'center' }}
              onClick={() => navigateTo('/conversations')}
            >
              <ListItemText primary="My Conversations" />
            </ListItemButton>
          </ListItem>
        )}
        <ListItem disablePadding>
          <ListItemButton sx={{ textAlign: 'center' }}>
            <ListItemText 
              primary={session ? "Sign Out" : "Sign In"} 
              onClick={session ? handleSignOut : handleSignIn}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Desktop Logo */}
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontWeight: 'bold',
                color: 'primary.main',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
              onClick={() => navigateTo('/')}
            >
              Everleigh
            </Typography>

            {/* Mobile Menu Icon */}
            <Box sx={{ flexGrow: 0, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="mobile menu"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleDrawerToggle}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
            </Box>

            {/* Mobile Logo */}
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                flexGrow: 1,
                display: { xs: 'flex', md: 'none' },
                fontWeight: 'bold',
                color: 'primary.main',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
              onClick={() => navigateTo('/')}
            >
              Everleigh
            </Typography>

            {/* Desktop Navigation */}
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {session && (
                <Button
                  onClick={() => navigateTo('/conversations')}
                  sx={{ my: 2, color: 'text.secondary', display: 'flex', alignItems: 'center' }}
                  startIcon={<HistoryIcon />}
                >
                  My Conversations
                </Button>
              )}
            </Box>

            {/* Theme Toggle Button */}
            <Box sx={{ mr: 2 }}>
              <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
            </Box>

            {/* User Menu */}
            <Box sx={{ flexGrow: 0 }}>
              {session ? (
                <>
                  <Tooltip title="Open user menu">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                      {session.user?.image ? (
                        <Avatar alt={session.user.name || 'User'} src={session.user.image} />
                      ) : (
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                        </Avatar>
                      )}
                    </IconButton>
                  </Tooltip>
                  <Menu
                    sx={{ mt: '45px' }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                  >
                    <MenuItem onClick={handleSignOut}>
                      <Typography textAlign="center">Sign Out</Typography>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PersonIcon />}
                  onClick={handleSignIn}
                >
                  Sign In
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  );
};

export default Header; 