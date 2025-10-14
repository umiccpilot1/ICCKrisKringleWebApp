export default function AssignmentList({ employees }) {
  if (!employees.length) {
    return <p className="mt-6 text-sm text-muted-700 text-center">No employee data yet.</p>;
  }
  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-card">
      <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-900 text-center">
        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-muted-700 font-semibold">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Recipient</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {employees.map((employee) => (
            <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900 text-center">{employee.name}</td>
              <td className="px-4 py-3 text-muted-700 text-center">{employee.email}</td>
              <td className="px-4 py-3 text-muted-700 text-center">{employee.is_admin ? 'Admin' : 'Employee'}</td>
              <td className="px-4 py-3 text-muted-700 text-center">
                {employee.recipient ? `${employee.recipient.name} (${employee.recipient.email})` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
