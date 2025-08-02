import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ContactSearch } from "@/components/ContactSearch";
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Upload,
  Download,
  UserPlus,
  Tag,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  UserCheck
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Contact {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: "active" | "unsubscribed" | "bounced" | "pending";
  tags: ContactTag[];
  lists: EmailList[];
  addedDate: Date;
  lastActivity?: Date | null;
  emailsSent: number;
  emailsOpened: number;
}

interface ContactTag {
  id: string;
  name: string;
  color: string;
}

interface EmailList {
  id: string;
  name: string;
  description?: string | null;
}

interface ContactStats {
  totalContacts: number;
  activeContacts: number;
  unsubscribedContacts: number;
  bouncedContacts: number;
  pendingContacts: number;
  totalLists: number;
  averageEngagementRate: number;
}

interface EmailListWithCount extends EmailList {
  count: number;
}

export default function EmailContacts() {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [listFilter, setListFilter] = useState("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle search changes from ContactSearch component
  const handleSearchChange = useCallback((search: string) => {
    setSearchQuery(search);
  }, []);

  // Debounce the search query for API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);



  // Fetch email contacts stats (independent of search/filters)
  const { data: statsData } = useQuery({
    queryKey: ['/api/email-contacts-stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-contacts?statsOnly=true');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache stats for 5 minutes
  });

  // Fetch email contacts (with search and filters)
  const { data: contactsData, isLoading: contactsLoading, error: contactsError, isFetching } = useQuery({
    queryKey: ['/api/email-contacts', { search: debouncedSearchQuery, status: statusFilter, listId: listFilter !== 'all' ? listFilter : undefined }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (listFilter !== 'all') params.append('listId', listFilter);
      
      const response = await apiRequest('GET', `/api/email-contacts?${params.toString()}`);
      return response.json();
    },
    staleTime: 30 * 1000, // Cache results for 30 seconds
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    retry: 1, // Only retry once on failure
    refetchOnMount: false, // Prevent automatic refetch on mount
    refetchOnReconnect: false, // Prevent refetch on reconnect
  });

  // Fetch email lists
  const { data: listsData } = useQuery({
    queryKey: ['/api/email-lists'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/email-lists');
      return response.json();
    },
  });

  const contacts: Contact[] = (contactsData as any)?.contacts || [];
  const stats: ContactStats = (statsData as any)?.stats || {
    totalContacts: 0,
    activeContacts: 0,
    unsubscribedContacts: 0,
    bouncedContacts: 0,
    pendingContacts: 0,
    totalLists: 0,
    averageEngagementRate: 0,
  };
  const lists: EmailListWithCount[] = listsData?.lists || [];

  const getStatusBadge = (status: Contact["status"]) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-700", icon: CheckCircle2, label: "Active" },
      unsubscribed: { color: "bg-gray-100 text-gray-700", icon: XCircle, label: "Unsubscribed" },
      bounced: { color: "bg-red-100 text-red-700", icon: AlertCircle, label: "Bounced" },
      pending: { color: "bg-yellow-100 text-yellow-700", icon: AlertCircle, label: "Pending" },
    };

    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || '??';
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const toggleSelectContact = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const getEngagementRate = (sent: number, opened: number) => {
    if (sent === 0) return 0;
    return Math.round((opened / sent) * 100);
  };

  // Show loading state
  if (contactsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-4">Loading contacts...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (contactsError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Contacts</h1>
          <p className="text-gray-600 mb-4">
            There was an error loading your email contacts. Please try again.
          </p>
          <Button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/email-contacts'] });
              queryClient.invalidateQueries({ queryKey: ['/api/email-contacts-stats'] });
            }} 
            variant="outline"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your email subscribers and contact lists
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setLocation('/email-contacts/new')}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContacts.toLocaleString()}</p>
              </div>
              <Users className="text-blue-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeContacts.toLocaleString()}</p>
                <p className="text-sm text-green-600">
                  {stats.totalContacts > 0 ? Math.round((stats.activeContacts / stats.totalContacts) * 100) : 0}%
                </p>
              </div>
              <UserCheck className="text-green-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Lists</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLists}</p>
              </div>
              <Tag className="text-purple-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Engagement</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageEngagementRate}%</p>
              </div>
              <Mail className="text-orange-500 w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lists Sidebar + Main Content */}
      <div className="flex gap-6">
        {/* Lists Sidebar */}
        <Card className="w-64 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Lists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button
                className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  listFilter === 'all' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : ""
                }`}
                onClick={() => setListFilter('all')}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">All Contacts</span>
                  <Badge variant="secondary" className="ml-2">
                    {stats.totalContacts}
                  </Badge>
                </div>
              </button>
              {lists.map((list) => (
                <button
                  key={list.id}
                  className={`w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    listFilter === list.id ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : ""
                  }`}
                  onClick={() => setListFilter(list.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{list.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {list.count}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create List
            </Button>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="flex-1">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <ContactSearch 
              key="contact-search"
              value={searchQuery}
              onSearchChange={handleSearchChange}
              placeholder="Search contacts..."
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              type="button"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedContacts.length > 0 && (
            <Card className="mb-4">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Tag className="w-4 h-4 mr-2" />
                      Add Tags
                    </Button>
                    <Button variant="outline" size="sm">
                      <Users className="w-4 h-4 mr-2" />
                      Add to List
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contacts Table */}
          <Card className="relative">
            <CardContent className="p-0">
              {/* Search Loading Indicator */}
              {isFetching && (
                <div className="absolute right-4 top-4 z-10">
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm">
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
                    Searching...
                  </div>
                </div>
              )}
              {/* Table with smooth transition */}
              <div className={`transition-opacity duration-200 ${isFetching ? 'opacity-50' : 'opacity-100'}`}>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedContacts.length === contacts.length && contacts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                          <Search className="h-8 w-8" />
                          <p>
                            {debouncedSearchQuery ? 
                              `No contacts found matching "${debouncedSearchQuery}"` : 
                              'No contacts found'
                            }
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={() => toggleSelectContact(contact.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(contact.firstName, contact.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {contact.firstName || contact.lastName 
                                ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                                : contact.email.split('@')[0]
                              }
                            </p>
                            <p className="text-sm text-gray-500">{contact.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(contact.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 flex-wrap">
                          {contact.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs" style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}>
                              {tag.name}
                            </Badge>
                          ))}
                          {contact.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{contact.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">
                            {getEngagementRate(contact.emailsSent, contact.emailsOpened)}% open rate
                          </p>
                          <p className="text-gray-500">
                            {contact.emailsOpened}/{contact.emailsSent} emails
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDate(contact.addedDate)}</p>
                          {contact.lastActivity && (
                            <p className="text-gray-500">
                              Active {formatDate(contact.lastActivity)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLocation(`/email-contacts/edit/${contact.id}`)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Contact
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="w-4 h-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="w-4 h-4 mr-2" />
                              View Activity
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Contact
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}