export default function AssignmentList({ employees }) {
  if (!employees.length) {
    return <p className="mt-6 text-sm text-slate-400">No employee data yet.</p>;
  }
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-soft">
      <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
        <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.25em] text-slate-400">
          <tr>
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Recipient</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td className="px-4 py-3 font-medium text-white">{employee.name}</td>
              <td className="px-4 py-3 text-slate-300">{employee.email}</td>
              <td className="px-4 py-3 text-slate-300">{employee.is_admin ? 'Admin' : 'Employee'}</td>
              <td className="px-4 py-3 text-slate-300">
                {employee.recipient ? `${employee.recipient.name} (${employee.recipient.email})` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
