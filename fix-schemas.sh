#!/bin/bash

# Fix all Schema export declarations in Schema.ts

file="D:\saas\AgentCoding\V3\Yamato-SaaS\src\models\Schema.ts"

# Fix remaining schemas
sed -i 's/export const planDetailSchema$/export const planDetailSchema = pgTable('\''plan_detail'\'', {/' "$file"
sed -i 's/export const processSchema$/export const processSchema = pgTable('\''process'\'', {/' "$file"  
sed -i 's/export const workTableSchema$/export const workTableSchema = pgTable('\''work_table'\'', {/' "$file"
sed -i 's/export const productsubSchema$/export const productsubSchema = pgTable('\''productsub'\'', {/' "$file"

echo "Schema fixes applied!"
