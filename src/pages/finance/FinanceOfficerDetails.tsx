import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, BadgeDollarSign, Building2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { API_CONFIG } from "@/config/api";

interface FinanceOfficer {
  id: string;
  firstName: string;
  lastName: string;
  username?: string; // Add username field
  email?: string; // may come nested under user
  phoneNumber?: string;
  department?: string;
  canApproveBudgets: boolean;
  canProcessPayments: boolean;
  status?: string; // may be absent
  hireDate?: string;
  user?: { username?: string; email?: string; isActive?: boolean };
  isActive?: boolean; // some APIs might return top-level isActive
}

export default function FinanceOfficerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [officer, setOfficer] = useState<FinanceOfficer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfficer = async () => {
      if (!id || !token) return;
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`${API_CONFIG.BASE_URL}/finance/officers/${id}` , {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate('/login');
          return;
        }
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to fetch finance officer');
        }
  const result = await res.json();
  // Derive a safe status if missing
  const derivedStatus = result.status || (result.user?.isActive || result.isActive ? 'active' : 'inactive');
  setOfficer({ ...result, status: derivedStatus });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to fetch finance officer';
        setError(msg);
        toast({ title: 'Error', description: msg, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchOfficer();
  }, [id, token, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !officer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/finance/officers/view')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Finance Officers
          </Button>
        </div>
        <div className="text-center p-8 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error || 'Finance officer not found'}
        </div>
      </div>
    );
  }

  const fullName = `${officer.firstName || ''} ${officer.lastName || ''}`.trim() || 'Finance Officer';
  const email = officer.email || officer.user?.email || 'N/A';
  const username = officer.username || officer.user?.username || 'N/A';
  const status = officer.status || (officer.user?.isActive || officer.isActive ? 'active' : 'inactive');
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/finance/officers/view')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Finance Officers
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{fullName}</CardTitle>
              <div className="mt-2 flex gap-2 items-center">
                <Badge variant={status === 'active' ? 'default' : status === 'on-leave' ? 'secondary' : 'destructive'}>
                  {statusLabel}
                </Badge>
                {officer.user?.username && (
                  <span className="text-sm text-muted-foreground">@{username}</span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{email}</span>
                </div>
                {officer.phoneNumber && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{officer.phoneNumber}</span>
                  </div>
                )}
                {officer.department && (
                  <div className="flex items-center space-x-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{officer.department}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Permissions</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span>{officer.canApproveBudgets ? 'Can Approve Budgets' : 'No Budget Approval'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <BadgeDollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{officer.canProcessPayments ? 'Can Process Payments' : 'No Payment Processing'}</span>
                </div>
                {officer.hireDate && (
                  <div className="text-sm text-muted-foreground">
                    Hired: {new Date(officer.hireDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
