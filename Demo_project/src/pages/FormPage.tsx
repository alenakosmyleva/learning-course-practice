import { Card, Form, Button } from 'react-bootstrap';

export default function FormPage() {
  return (
    <>
      <h4 className="mb-3">Contact Form</h4>
      <Card style={{ maxWidth: 600 }}>
        <Card.Body>
          <Form className="d-flex flex-column gap-3">
            <Form.Group controlId="formName">
              <Form.Label>Name</Form.Label>
              <Form.Control type="text" placeholder="Your name" />
            </Form.Group>
            <Form.Group controlId="formEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" placeholder="you@example.com" />
            </Form.Group>
            <Form.Group controlId="formPhone">
              <Form.Label>Phone</Form.Label>
              <Form.Control type="tel" placeholder="+1 (555) 000-0000" />
            </Form.Group>
            <Form.Group controlId="formCompany">
              <Form.Label>Company</Form.Label>
              <Form.Control type="text" placeholder="Company name" />
            </Form.Group>
            <Form.Group controlId="formMessage">
              <Form.Label>Message</Form.Label>
              <Form.Control as="textarea" rows={4} placeholder="Your message..." />
            </Form.Group>
            <div className="d-flex gap-2 justify-content-end">
              <Button variant="outline-secondary">Cancel</Button>
              <Button variant="primary">Submit</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
}
