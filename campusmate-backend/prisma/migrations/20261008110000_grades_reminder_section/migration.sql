-- Add the missing Reminder.sectionId relationship.
ALTER TABLE "Reminder"
ADD COLUMN IF NOT EXISTS "sectionId" TEXT;

ALTER TABLE "Reminder"
ADD CONSTRAINT "Reminder_sectionId_fkey"
FOREIGN KEY ("sectionId") REFERENCES "Section"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Recreate the academic record models required by the grades API.
CREATE TABLE IF NOT EXISTS "AcademicRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "termId" TEXT NOT NULL,
    "sgpa" DOUBLE PRECISION,
    "cgpa" DOUBLE PRECISION,
    "totalCredits" DOUBLE PRECISION,
    "earnedCredits" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AcademicRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AcademicRecord_studentId_termId_key"
ON "AcademicRecord"("studentId", "termId");

ALTER TABLE "AcademicRecord"
ADD CONSTRAINT "AcademicRecord_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "Student"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AcademicRecord"
ADD CONSTRAINT "AcademicRecord_termId_fkey"
FOREIGN KEY ("termId") REFERENCES "AcademicTerm"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "Grade" (
    "id" TEXT NOT NULL,
    "academicRecordId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "gradePoint" DOUBLE PRECISION NOT NULL,
    "credits" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Grade_academicRecordId_subjectId_key"
ON "Grade"("academicRecordId", "subjectId");

ALTER TABLE "Grade"
ADD CONSTRAINT "Grade_academicRecordId_fkey"
FOREIGN KEY ("academicRecordId") REFERENCES "AcademicRecord"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Grade"
ADD CONSTRAINT "Grade_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "Subject"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
