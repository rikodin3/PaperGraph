import React, { useState, useEffect } from 'react';
import { Container, Box, Alert, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import Graph from './components/Graph';
import PaperDetails from './components/PaperDetails';
import { searchPapers, getGraphData, getPaperById } from './services/api';

const MainContainer = styled(Container)(({ theme }) => ({
  maxWidth: '100%',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: '#fafafa',
}));

const ContentArea = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  padding: theme.spacing(2),
}));

const GraphWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'auto',
}));

function App() {
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleSearch = async (query) => {
    setIsSearching(true);
    setError(null);
    try {
      // Search for papers
      const results = await searchPapers(query);

      if (results.length === 0) {
        setError('No papers found. Try a different search.');
        setGraphData({ nodes: [], links: [] });
        return;
      }

      // Select first result and load its graph
      const firstPaper = results[0];
      await loadPaperGraph(firstPaper);
    } catch (err) {
      setError('Failed to search papers. Please try again.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const loadPaperGraph = async (paper) => {
    setIsLoadingDetails(true);
    try {
      // Get graph data for the paper
      const graphDataResponse = await getGraphData(paper.id, 2);
      setGraphData(graphDataResponse);
      setSelectedPaper(paper);
      setIsDrawerOpen(true);
    } catch (err) {
      setError('Failed to load paper graph.');
      console.error(err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleNodeClick = async (node) => {
    setIsLoadingDetails(true);
    try {
      // Fetch detailed info about the clicked paper
      const paperDetails = await getPaperById(node.id);
      setSelectedPaper(paperDetails);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error('Failed to load paper details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSelectRelatedPaper = async (relatedPaper) => {
    if (typeof relatedPaper === 'string') {
      // If it's just a string ID, search for it
      try {
        const results = await searchPapers(relatedPaper);
        if (results.length > 0) {
          await loadPaperGraph(results[0]);
        }
      } catch (err) {
        console.error('Failed to load related paper:', err);
      }
    } else {
      await loadPaperGraph(relatedPaper);
    }
  };

  return (
    <MainContainer>
      <Header />

      <ContentArea>
        <SearchBar onSearch={handleSearch} isLoading={isSearching} />

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <GraphWrapper>
          {isSearching ? (
            <CircularProgress />
          ) : (
            <Graph
              data={graphData}
              onNodeClick={handleNodeClick}
              isLoading={isSearching}
            />
          )}
        </GraphWrapper>
      </ContentArea>

      <PaperDetails
        paper={selectedPaper}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectPaper={handleSelectRelatedPaper}
        isLoading={isLoadingDetails}
      />
    </MainContainer>
  );
}

export default App;