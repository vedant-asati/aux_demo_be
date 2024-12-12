# seed.sh
#!/bin/bash

# Database connection details
DB_NAME="auxdemo"
DB_USER="postgres"
DB_PASSWORD="root"
DB_HOST="localhost"
DB_PORT="5432"

# # Create database if it doesn't exist
echo "Creating database if it doesn't exist..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true

# Function to run SQL file
run_sql_file() {
    echo "Running $1..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $1
}

# Run migrations first
echo "Running Prisma migrations..."
# npx prisma migrate deploy
# npx prisma migrate reset

# Run seed files in order
# run_sql_file "prisma/seeds/clean.sql"
run_sql_file "prisma/seeds/00_users.sql"
run_sql_file "prisma/seeds/01_products.sql"
run_sql_file "prisma/seeds/02_auctions.sql"
run_sql_file "prisma/seeds/03_bids.sql"

echo "Seeding completed!"