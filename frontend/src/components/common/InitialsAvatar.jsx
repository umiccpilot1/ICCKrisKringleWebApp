export default function InitialsAvatar({ name, size = 150, ...props }) {
  // Extract initials from name
  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Generate consistent color based on name
  const getColorFromName = (fullName) => {
    if (!fullName) return '#6B7280'; // gray-500
    
    const colors = [
      '#EF4444', // red-500
      '#F97316', // orange-500
      '#F59E0B', // amber-500
      '#10B981', // emerald-500
      '#06B6D4', // cyan-500
      '#3B82F6', // blue-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#14B8A6', // teal-500
      '#84CC16', // lime-500
    ];
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(name);
  const bgColor = getColorFromName(name);
  const fontSize = Math.floor(size * 0.4); // 40% of size

  return (
    <div
      {...props}
      className="flex items-center justify-center rounded-full font-bold text-white shadow-lg"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: bgColor,
        fontSize: `${fontSize}px`,
      }}
      title={name}
    >
      {initials}
    </div>
  );
}
