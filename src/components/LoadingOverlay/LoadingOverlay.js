import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Loader } from 'lucide-react';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease;
`;

const LoadingCard = styled.div`
  background-color: ${props => props.theme.surfaceElevated};
  border-radius: 8px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const LoadingSpinner = styled.div`
  animation: ${spin} 1.5s linear infinite;
  margin-bottom: 1.5rem;
  color: ${props => props.theme.accent};
`;

const Title = styled.h3`
  margin: 0;
  margin-bottom: 1rem;
  color: ${props => props.theme.text};
`;

const Message = styled.p`
  margin: 0;
  text-align: center;
  color: ${props => props.theme.textSecondary};
  line-height: 1.5;
`;

function LoadingOverlay({ message }) {
  return (
    <OverlayContainer>
      <LoadingCard>
        <LoadingSpinner>
          <Loader size={48} />
        </LoadingSpinner>
        <Title>Processing Project</Title>
        <Message>{message || "Please wait while we analyze your files..."}</Message>
      </LoadingCard>
    </OverlayContainer>
  );
}

export default LoadingOverlay;