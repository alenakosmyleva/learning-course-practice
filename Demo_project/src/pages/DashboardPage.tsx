import { Card, Row, Col } from 'react-bootstrap';

const stats = [
  { title: 'Revenue', value: '$24,500', subtitle: '+12% from last month' },
  { title: 'Users', value: '1,240', subtitle: '+8% from last month' },
  { title: 'Orders', value: '320', subtitle: '+5% from last month' },
  { title: 'Conversion', value: '3.2%', subtitle: '+0.4% from last month' },
];

export default function DashboardPage() {
  return (
    <>
      <h4 className="mb-3">Dashboard</h4>
      <Row className="g-3">
        {stats.map((stat) => (
          <Col key={stat.title} xs={12} sm={6} md={3}>
            <Card>
              <Card.Body>
                <Card.Text className="text-body-secondary mb-1">
                  {stat.title}
                </Card.Text>
                <h4>{stat.value}</h4>
                <Card.Text className="text-body-secondary small">
                  {stat.subtitle}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
