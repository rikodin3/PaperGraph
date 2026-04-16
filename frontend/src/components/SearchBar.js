import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from '@mui/material/styles';

const StyledSearchBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: theme.spacing(2),
  gap: theme.spacing(1),
  '& .MuiTextField-root': {
    width: '100%',
    maxWidth: '500px',
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      '&:hover fieldset': {
        borderColor: '#667eea',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#667eea',
        boxShadow: '0 0 10px rgba(102, 126, 234, 0.2)',
      },
    },
  },
}));

const StyledSearchButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  textTransform: 'none',
  fontSize: '1rem',
  padding: '10px 30px',
  borderRadius: '8px',
  '&:hover': {
    background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
}));

function SearchBar({ onSearch, isLoading = false }) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim() && onSearch) {
      onSearch(query.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <StyledSearchBox>
      <TextField
        placeholder="Search by paper title, authors, or keywords..."
        variant="outlined"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isLoading}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#667eea', marginRight: 1 }} />
            </InputAdornment>
          ),
        }}
        size="medium"
      />
      <StyledSearchButton
        onClick={handleSearch}
        disabled={isLoading || !query.trim()}
        sx={{ minWidth: '120px' }}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Search'}
      </StyledSearchButton>
    </StyledSearchBox>
  );
}

export default SearchBar;