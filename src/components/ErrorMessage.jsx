import { Alert, Box } from "@mui/material";

export default function ErrorMessage({ message }) {
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Alert severity="error">{message}</Alert>
    </Box>
  );
} 