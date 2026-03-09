import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container } from 'react-bootstrap';
import DashboardPage from './pages/DashboardPage';
import ListPage from './pages/ListPage';
import FormPage from './pages/FormPage';

const pages = [
  { label: 'Dashboard', path: '/' },
  { label: 'Users', path: '/list' },
  { label: 'Contact', path: '/form' },
];

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar bg="primary" data-bs-theme="dark" expand="sm">
        <Container>
          <Navbar.Brand href="#" onClick={() => navigate('/')}>
            Demo Project
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              {pages.map((page) => (
                <Nav.Link
                  key={page.path}
                  active={location.pathname === page.path}
                  onClick={() => navigate(page.path)}
                >
                  {page.label}
                </Nav.Link>
              ))}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="mt-4 mb-4 flex-grow-1">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/list" element={<ListPage />} />
          <Route path="/form" element={<FormPage />} />
        </Routes>
      </Container>
    </div>
  );
}
