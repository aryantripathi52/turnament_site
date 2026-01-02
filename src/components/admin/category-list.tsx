'use client';

import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import type { Category } from '@/lib/types';
import { Button } from '../ui/button';

export function CategoryList() {
  const firestore = useFirestore();

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: categories, isLoading, error } = useCollection<Category>(categoriesQuery);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Categories</AlertTitle>
        <AlertDescription>
          There was a problem loading the game categories. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border rounded-md">
        <p>No game categories have been created yet.</p>
        <p className="text-sm mt-2">Click "Add Category" to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((category) => (
        <Card key={category.id} className="overflow-hidden">
          <CardHeader className="p-0">
             <div className="aspect-video relative">
                 <Image
                    src={category.imageUrl}
                    alt={`Image for ${category.name}`}
                    fill
                    className="object-cover"
                />
             </div>
          </CardHeader>
          <CardContent className="p-4">
            <h4 className="font-semibold text-lg truncate">{category.name}</h4>
          </CardContent>
          <CardFooter className="p-4 pt-0">
             <Button variant="outline" size="sm" className="w-full" disabled>Manage</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

    