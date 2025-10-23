const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');
const db = new Database(dbPath);

const photosDir = path.join(__dirname, '../../frontend/public/images/employees');

function normalizeString(str) {
  return str.toUpperCase().trim().replace(/\s+/g, ' ');
}

function extractLastName(fullName) {
  const parts = fullName.trim().split(' ');
  return parts[parts.length - 1];
}

function extractFirstName(fullName) {
  const parts = fullName.trim().split(' ');
  return parts[0];
}

function matchPhotoToEmployee(employee, photoFiles) {
  const lastName = normalizeString(extractLastName(employee.name));
  const firstName = normalizeString(extractFirstName(employee.name));
  
  // Try exact last name match first
  let match = photoFiles.find(file => {
    const fileNameWithoutExt = path.basename(file, path.extname(file));
    return normalizeString(fileNameWithoutExt) === lastName;
  });
  
  // If not found, try LASTNAME-FIRSTNAME pattern
  if (!match) {
    const lastNameFirstName = `${lastName}-${firstName}`;
    match = photoFiles.find(file => {
      const fileNameWithoutExt = path.basename(file, path.extname(file));
      return normalizeString(fileNameWithoutExt) === lastNameFirstName;
    });
  }
  
  // If still not found, try LASTNAME FIRSTNAME with space (for files like "FLORES C.png")
  if (!match) {
    const lastNameFirstInitial = `${lastName} ${firstName.charAt(0)}`;
    match = photoFiles.find(file => {
      const fileNameWithoutExt = path.basename(file, path.extname(file));
      return normalizeString(fileNameWithoutExt) === lastNameFirstInitial;
    });
  }
  
  return match;
}

try {
  // Get all photo files
  const photoFiles = fs.readdirSync(photosDir).filter(file => 
    file.toLowerCase().endsWith('.png') || file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')
  );
  
  console.log(`Found ${photoFiles.length} photo files in ${photosDir}`);
  
  // Get all employees
  const employees = db.prepare('SELECT id, name FROM employees').all();
  console.log(`Found ${employees.length} employees in database`);
  
  let matchedCount = 0;
  let unmatchedEmployees = [];
  
  const updateStmt = db.prepare('UPDATE employees SET photo_filename = ? WHERE id = ?');
  
  employees.forEach(employee => {
    const matchedPhoto = matchPhotoToEmployee(employee, photoFiles);
    
    if (matchedPhoto) {
      updateStmt.run(matchedPhoto, employee.id);
      console.log(`âœ“ Matched ${employee.name} â†’ ${matchedPhoto}`);
      matchedCount++;
    } else {
      unmatchedEmployees.push(employee.name);
      console.log(`âœ— No photo found for ${employee.name}`);
    }
  });
  
  console.log('\n=== Summary ===');
  console.log(`Matched: ${matchedCount}/${employees.length}`);
  console.log(`Unmatched: ${unmatchedEmployees.length}`);
  
  if (unmatchedEmployees.length > 0) {
    console.log('\nEmployees without photos:');
    unmatchedEmployees.forEach(name => console.log(`  - ${name}`));
  }
  
  db.close();
} catch (error) {
  console.error('Error matching photos:', error);
  process.exit(1);
}
