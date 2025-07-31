import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  firstName: string;
  lastName: string;
  status: "active" | "unsubscribed" | "bounced" | "pending";
  tags: string[];
  lists: string[];
  addedDate: string;
  lastActivity?: string;
  emailsSent: number;
  emailsOpened: number;
}

const mockContacts: Contact[] = [
  {
    id: "1",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    status: "active",
    tags: ["customer", "premium", "newsletter"],
    lists: ["All Contacts", "Premium Customers"],
    addedDate: "2025-03-15",
    lastActivity: "2025-07-28",
    emailsSent: 24,
    emailsOpened: 18,
  },
  {
    id: "2",
    email: "jane.smith@company.com",
    firstName: "Jane",
    lastName: "Smith",
    status: "active",
    tags: ["lead", "webinar-attendee"],
    lists: ["All Contacts", "Leads"],
    addedDate: "2025-06-20",
    lastActivity: "2025-07-25",
    emailsSent: 8,
    emailsOpened: 6,
  },
  {
    id: "3",
    email: "mike.wilson@email.com",
    firstName: "Mike",
    lastName: "Wilson",
    status: "unsubscribed",
    tags: ["customer"],
    lists: ["All Contacts"],
    addedDate: "2025-02-10",
    lastActivity: "2025-05-15",
    emailsSent: 15,
    emailsOpened: 10,
  },
  {
    id: "4",
    email: "sarah.jones@test.com",
    firstName: "Sarah",
    lastName: "Jones",
    status: "bounced",
    tags: ["lead"],
    lists: ["All Contacts", "Leads"],
    addedDate: "2025-07-01",
    lastActivity: "2025-07-10",
    emailsSent: 3,
    emailsOpened: 0,
  },
  {
    id: "5",
    email: "alex.brown@startup.io",
    firstName: "Alex",
    lastName: "Brown",
    status: "pending",
    tags: ["trial-user"],
    lists: ["All Contacts", "Trial Users"],
    addedDate: "2025-07-28",
    emailsSent: 1,
    emailsOpened: 0,
  },
];

const mockLists = [
  { id: "1", name: "All Contacts", count: 2847 },
  { id: "2", name: "Premium Customers", count: 342 },
  { id: "3", name: "Leads", count: 1205 },
  { id: "4", name: "Trial Users", count: 89 },
  { id: "5", name: "Newsletter Subscribers", count: 1876 },
];

export default function EmailContacts() {
  const [contacts] = useState<Contact[]>(mockContacts);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [listFilter, setListFilter] = useState("all");

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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  const getEngagementRate = (sent: number, opened: number) => {
    if (sent === 0) return 0;
    return Math.round((opened / sent) * 100);
  };

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
            <Button className="bg-blue-600 hover:bg-blue-700">
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
                <p className="text-2xl font-bold text-gray-900">2,847</p>
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
                <p className="text-2xl font-bold text-gray-900">2,485</p>
                <p className="text-sm text-green-600">87.3%</p>
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
                <p className="text-2xl font-bold text-gray-900">{mockLists.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">68.4%</p>
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
              {mockLists.map((list) => (
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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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
            <Button variant="outline">
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
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedContacts.length === contacts.length}
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
                  {contacts.map((contact) => (
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
                              {contact.firstName} {contact.lastName}
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
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
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
                            <DropdownMenuItem>
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}