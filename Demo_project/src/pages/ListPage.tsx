import { Table, Badge, Button } from 'react-bootstrap';

const users = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' as const },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Editor', status: 'Active' as const },
  { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'Viewer', status: 'Inactive' as const },
  { id: 4, name: 'David Brown', email: 'david@example.com', role: 'Editor', status: 'Active' as const },
  { id: 5, name: 'Eve Davis', email: 'eve@example.com', role: 'Viewer', status: 'Inactive' as const },
];

export default function ListPage() {
  return (
    <>
      <h4 className="mb-3">Users</h4>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <Badge bg={user.status === 'Active' ? 'success' : 'secondary'}>
                  {user.status}
                </Badge>
              </td>
              <td className="text-end">
                <Button variant="outline-primary" size="sm">Edit</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
