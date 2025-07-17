export default function DriverTabLayout() {
  const currentUser = AuthService.getCurrentUser(); // ✅ Move this here

  useEffect(() => {
    const checkAuth = () => {
      const user = AuthService.getCurrentUser(); // optional: use local variable

      if (!AuthService.isAuthenticated()) {
        router.replace('/auth');
        return;
      }

      if (user?.role !== 'driver') {
        router.replace('/(tabs)');
        return;
      }
    };

    checkAuth();
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentUser || currentUser.role !== 'driver') {
    return null;
  }

  if (!AuthService.isAuthenticated()) {
    return null;
  }

  return (
    <Tabs
      // ... tab config
    >
      {/* screens */}
    </Tabs>
  );
}
