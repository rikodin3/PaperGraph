import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
}));

function Header() {
  return (
    <StyledAppBar position="static">
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.5rem',
              background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            📄 PaperGraph
          </Typography>
          <Typography
            variant="body2"
            sx={{
              marginLeft: 'auto',
              opacity: 0.9,
              fontSize: '0.9rem',
            }}
          >
            Explore academic paper relationships
          </Typography>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
}

export default Header;
