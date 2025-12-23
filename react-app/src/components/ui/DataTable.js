import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";

export function DataTable({ data, columns }) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden animate-fade-in">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {columns.map((column) => (
              <TableHead key={String(column.key)} className="font-semibold text-card-foreground">
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={item.id}
              className="hover:bg-muted/30 transition-colors"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {columns.map((column) => (
                <TableCell key={String(column.key)}>
                  {column.render
                    ? column.render(item)
                    : String(item[column.key] ?? "")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

