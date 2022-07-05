import { Header } from "../components/Header"
import { RecoilRoot } from "recoil";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from "@mui/material";

function App({ Component, pageProps }) {
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  return (
    <ThemeProvider theme={darkTheme}>
      <RecoilRoot>
        <CssBaseline />
        <Header />
        <Component { ...pageProps } />
      </RecoilRoot>
    </ThemeProvider>
  );
}

export default App;
