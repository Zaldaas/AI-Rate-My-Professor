"use client";
import Image from "next/image";
import styles from "./page.module.css";
import { 
  Box, 
  Stack, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  CircularProgress,
  useTheme,
  ThemeProvider,
  createTheme
} from "@mui/material";
import { useState } from "react";
import SendIcon from '@mui/icons-material/Send';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#4791db',
      dark: '#115293',
    },
    secondary: {
      main: '#67a3ee',
      light: '#8bb8f1',
      dark: '#4771a6',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
});

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi, I'm the Rate My Professor Assistant. I can help you find information about professors, their ratings, and teaching styles. How can I assist you today?",
    },
  ]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setMessages((messages) => [
      ...messages,
      {role: "user", content: message},
      {role: "assistant", content: ""},
    ]);

    setMessage("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, {role: "user", content: message}])
      }).then(async (res) => {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        let result = "";
        return reader.read().then(function processText({done, value}) {
          if (done) {
            setIsLoading(false);
            return result;
          }
          const text = decoder.decode(value || new Int8Array(), {stream: true});
          setMessages((messages) => {
            let lastMessage = messages[messages.length - 1];
            let otherMessages = messages.slice(0, messages.length - 1);
            return [
              ...otherMessages,
              {...lastMessage, content: lastMessage.content + text},
            ];
          });
          return reader.read().then(processText);
        });
      });
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box 
        sx={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          p: 3
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            maxWidth: "800px",
            height: "90vh",
            margin: "auto",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 3
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'primary.main',
              color: 'white',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}
          >
            <Typography variant="h5" fontWeight="bold">
              Rate My Professor Assistant
            </Typography>
            <Typography variant="body2">
              Your AI guide to professor information and ratings
            </Typography>
          </Box>

          {/* Messages Area */}
          <Stack 
            direction="column" 
            spacing={2} 
            flexGrow={1} 
            sx={{
              overflow: "auto",
              p: 3,
              bgcolor: 'background.default',
            }}
          >
            {messages.map((message, index) => (
              <Box 
                key={index} 
                display="flex"
                justifyContent={message.role === "assistant" ? "flex-start" : "flex-end"}
              >
                <Paper
                  elevation={1}
                  sx={{
                    maxWidth: '70%',
                    bgcolor: message.role === "assistant" ? 'primary.main' : 'secondary.main',
                    color: 'white',
                    borderRadius: 3,
                    p: 2,
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                    borderTopLeftRadius: message.role === "assistant" ? 0 : 3,
                    borderTopRightRadius: message.role === "assistant" ? 3 : 0,
                    '& .markdown': {
                     whiteSpace: 'pre-wrap',
                     wordBreak: 'break-word',
                   },
                   '& a': {
                     color: '#ffffff',
                     textDecoration: 'underline',
                   },
                   '& code': {
                     backgroundColor: 'rgba(0, 0, 0, 0.2)',
                     padding: '0.1rem 0.3rem',
                     borderRadius: '3px',
                     fontFamily: 'var(--font-geist-mono)',
                     fontSize: '0.75rem',
                     wordBreak: 'break-all',
                   },
                   '& pre': {
                     backgroundColor: 'rgba(0, 0, 0, 0.2)',
                     padding: '0.5rem',
                     borderRadius: '5px',
                     overflowX: 'auto',
                     border: '1px solid var(--border-color)',
                   },
                   '& pre code': {
                     backgroundColor: 'transparent',
                     padding: 0,
                   },
                   '& blockquote': {
                     borderLeft: '3px solid var(--text-color)',
                     paddingLeft: '0.5rem',
                     margin: '0.5rem 0',
                   },
                   '& ul, & ol': {
                     paddingLeft: '1.5rem',
                     marginBottom: '0.5rem',
                   },
                   '& h1, & h2, & h3, & h4, & h5, & h6': {
                     margin: '0.5rem 0',
                   },
                   '& table': {
                     borderCollapse: 'collapse',
                     width: '100%',
                     marginBottom: '0.5rem',
                   },
                   '& th, & td': {
                     border: '1px solid var(--border-color)',
                     padding: '0.25rem',
                     textAlign: 'left',
                   },
                   '& hr': {
                     border: 'none',
                     borderBottom: '1px solid var(--border-color)',
                     margin: '0.5rem 0',
                   },
                  }}
                  className="markdown"
                >
                  <ReactMarkdown
                   rehypePlugins={[rehypeRaw, rehypeSanitize]}
                   remarkPlugins={[remarkGfm]}
                 >
                   {message.content}
                 </ReactMarkdown>
                </Paper>
              </Box>
            ))}
          </Stack>

          {/* Input Area */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Type your message"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                multiline
                maxRows={4}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  }
                }}
              />
              <Button 
                variant="contained" 
                onClick={sendMessage}
                disabled={isLoading || !message.trim()}
                sx={{
                  borderRadius: 3,
                  minWidth: '50px',
                  height: '50px',
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <SendIcon />
                )}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}