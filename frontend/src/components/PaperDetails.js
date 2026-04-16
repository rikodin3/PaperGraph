import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Divider,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const DrawerContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  overflowY: 'auto',
  height: '100%',
}));

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1),
  color: '#667eea',
  fontSize: '1.1rem',
}));

const RelatedPaperButton = styled(Button)(({ theme }) => ({
  justifyContent: 'flex-start',
  marginBottom: theme.spacing(1),
  textTransform: 'none',
  color: '#667eea',
  '&:hover': {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
}));

function PaperDetails({ paper, isOpen, onClose, onSelectPaper, isLoading = false }) {
  if (!paper) {
    return null;
  }

  return (
    <Drawer anchor="right" open={isOpen} onClose={onClose}>
      <Box sx={{ width: 400 }}>
        <DrawerHeader>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Paper Details
          </Typography>
          <Button
            size="small"
            onClick={onClose}
            sx={{ minWidth: 'auto', padding: 0 }}
          >
            <CloseIcon />
          </Button>
        </DrawerHeader>

        {isLoading ? (
          <DrawerContent
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CircularProgress />
          </DrawerContent>
        ) : (
          <DrawerContent>
            {/* Title */}
            <Section>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.3rem',
                  lineHeight: 1.3,
                }}
              >
                {paper.title}
              </Typography>
            </Section>

            <Divider />

            {/* Authors */}
            {paper.authors && paper.authors.length > 0 && (
              <Section>
                <SectionTitle>Authors</SectionTitle>
                <Typography variant="body2" color="textSecondary">
                  {Array.isArray(paper.authors)
                    ? paper.authors.join(', ')
                    : paper.authors}
                </Typography>
              </Section>
            )}

            {/* Abstract */}
            {paper.abstract && (
              <Section>
                <SectionTitle>Abstract</SectionTitle>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {paper.abstract}
                </Typography>
              </Section>
            )}

            {/* Year */}
            {paper.year && (
              <Section>
                <SectionTitle>Year</SectionTitle>
                <Typography variant="body2">{paper.year}</Typography>
              </Section>
            )}

            {/* Citations */}
            {paper.citations !== undefined && (
              <Section>
                <SectionTitle>Citation Count</SectionTitle>
                <Chip
                  label={`${paper.citations} citations`}
                  color="primary"
                  variant="outlined"
                />
              </Section>
            )}

            {/* Related Papers */}
            {paper.relatedPapers && paper.relatedPapers.length > 0 && (
              <Section>
                <SectionTitle>Related Papers</SectionTitle>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {paper.relatedPapers.slice(0, 5).map((relatedPaper, idx) => (
                    <RelatedPaperButton
                      key={idx}
                      fullWidth
                      onClick={() => onSelectPaper && onSelectPaper(relatedPaper)}
                      size="small"
                    >
                      <Typography variant="body2" sx={{ textAlign: 'left' }}>
                        {relatedPaper.title || relatedPaper}
                      </Typography>
                    </RelatedPaperButton>
                  ))}
                </Box>
              </Section>
            )}

            {/* External Link */}
            {paper.url && (
              <Section>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                  onClick={() => window.open(paper.url, '_blank')}
                >
                  View on Source
                </Button>
              </Section>
            )}
          </DrawerContent>
        )}
      </Box>
    </Drawer>
  );
}

export default PaperDetails;