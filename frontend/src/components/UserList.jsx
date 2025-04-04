const UserList = ({ users }) => (
    <div className="mt-4 bg-gray-100 p-4 rounded-md">
      <h2 className="text-lg font-bold">Online Users</h2>
      <ul>
        {users.map((user, index) => (
          <li key={index} className="p-1">{user}</li>
        ))}
      </ul>
    </div>
  );
  
  export default UserList;
  