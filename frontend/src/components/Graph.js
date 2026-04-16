import React, { useEffect, useRef, useState } from 'react';
import ForceGraph from 'react-force-graph-2d';
import { Box, CircularProgress, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const GraphContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: '600px',
  borderRadius: '12px',
  overflow: 'hidden',
  backgroundColor: '#f5f5f5',
  border: '1px solid #e0e0e0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

function Graph({ data, onNodeClick, isLoading = false }) {
  const graphRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });

  useEffect(() => {
    if (data && data.nodes && data.links) {
      // Transform data for the graph
      const nodes = data.nodes.map((node, idx) => ({
        id: node.id || idx.toString(),
        name: node.title || node.name || `Paper ${idx}`,
        val: node.citations || 5,
        color: node.highlighted ? '#667eea' : '#b0b0b0',
        ...node,
      }));

      const links = data.links.map((link) => ({
        source: link.source,
        target: link.target,
        value: link.weight || 1,
      }));

      setGraphData({ nodes, links });

      // Auto-zoom to fit
      if (graphRef.current) {
        setTimeout(() => {
          graphRef.current?.zoomToFit(400);
        }, 100);
      }
    }
  }, [data]);

  if (isLoading) {
    return (
      <GraphContainer>
        <LoadingContainer>
          <CircularProgress />
          <Typography color="textSecondary">Loading graph...</Typography>
        </LoadingContainer>
      </GraphContainer>
    );
  }

  if (!graphData.nodes || graphData.nodes.length === 0) {
    return (
      <GraphContainer>
        <LoadingContainer>
          <Typography color="textSecondary">
            Search for a paper to visualize its connections
          </Typography>
        </LoadingContainer>
      </GraphContainer>
    );
  }

  return (
    <GraphContainer>
      <ForceGraph
        ref={graphRef}
        graphData={graphData}
        nodeLabel="name"
        nodeColor={(node) => node.color}
        nodeVal={(node) => node.val}
        linkColor={() => '#d0d0d0'}
        onNodeClick={(node) => {
          if (onNodeClick) {
            onNodeClick(node);
          }
        }}
        width={window.innerWidth - 32}
        height={600}
        warmupTicks={100}
        cooldownTicks={0}
        enableNodeDrag={true}
        enablePanInteraction={true}
        enableZoomInteraction={true}
      />
    </GraphContainer>
  );
}

export default Graph;