import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle, SimpleThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemePersistence, getStoredTheme, clearThemePreferences } from '@/hooks/useThemePersistence';
import { useAuth } from '@/contexts/AuthContext';
import { Palette, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

/**
 * Theme Demo Component - Shows theme persistence functionality
 * This component demonstrates:
 * - Theme switching
 * - Theme persistence across refreshes
 * - User-specific theme preferences
 * - Storage status
 */
export const ThemeDemo: React.FC = () => {
  const { theme, actualTheme } = useTheme();
  const { user } = useAuth();
  const { isThemePersisted } = useThemePersistence();
  const storedTheme = getStoredTheme();

  const handleClearPreferences = () => {
    clearThemePreferences();
    window.location.reload(); // Reload to see the effect
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          <CardTitle>Theme Persistence Demo</CardTitle>
        </div>
        <CardDescription>
          Test theme persistence across page refreshes, sessions, and user logins
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Current Theme Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Current Theme Status</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>Selected Theme:</span>
                <Badge variant="outline">{theme}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Active Theme:</span>
                <Badge variant={actualTheme === 'dark' ? 'default' : 'secondary'}>
                  {actualTheme}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Stored Theme:</span>
                <Badge variant="outline">{storedTheme}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>localStorage Check:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {typeof window !== 'undefined' ? localStorage.getItem('theme') || 'null' : 'N/A'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Persistence Status:</span>
                {isThemePersisted ? (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Disabled
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">User Information</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>Logged In:</span>
                <Badge variant={user ? 'default' : 'secondary'}>
                  {user ? 'Yes' : 'No'}
                </Badge>
              </div>
              {user && (
                <>
                  <div className="flex items-center justify-between">
                    <span>User Role:</span>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>User ID:</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {user.id.slice(0, 8)}...
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Theme Controls */}
        <div className="space-y-4">
          <h4 className="font-medium">Theme Controls</h4>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Full Toggle:</span>
              <ThemeToggle />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm">Simple Toggle:</span>
              <SimpleThemeToggle />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm">Reset:</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearPreferences}
                className="h-9"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear Preferences
              </Button>
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium">Testing Instructions</h4>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Change the theme using the toggles above</li>
            <li>Refresh the page to verify persistence</li>
            <li>Open a new tab/window to test cross-tab persistence</li>
            <li>Clear browser data to test fallback behavior</li>
            <li>Log out and back in to test user-specific preferences</li>
          </ol>
        </div>

        {/* Browser Storage Info */}
        <div className="space-y-2">
          <h4 className="font-medium">Storage Details</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• General theme preference: localStorage['theme']</p>
            {user && <p>• User-specific preference: localStorage['theme-{user.id}']</p>}
            <p>• Backend sync: PATCH /api/v1/settings (when authenticated)</p>
            <p>• Fallback: System preference or 'light' mode</p>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
