import { PlaygroundPage } from "./pages/PlaygroundPage";
import { Route, Router } from "./components/Router";
import { HomePage } from "./pages/HomePage";
import { Layout } from "./components/Layout";

export function App() {
  return (
    <Router>
      <Layout>
        <Route path="/">
          <HomePage />
        </Route>
        <Route path="/playground">
          <PlaygroundPage />
        </Route>
        <Route path="/docs">hello</Route>
      </Layout>
    </Router>
  );
}
