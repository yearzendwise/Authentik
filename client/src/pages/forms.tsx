import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

export default function Forms2() {
  const [forms, setForms] = useState<any[]>([]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Forms</h1>
        <Link href="/forms/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Form
          </Button>
        </Link>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No forms created yet</p>
            <Link href="/forms/add">
              <Button>Create your first form</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{form.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{form.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}