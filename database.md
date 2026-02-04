# Database Design

This doc explains the database design and all info related to database.

## ERD

Table diagram

![Project Status Badge](db.svg)

### Table Info

- ## Users Table

  - Constrains
    - email is unique key and it [required]
    - role is text closed with enum values: [EDITOR, ADMIN, REVIEWER] [required] default is `EDITOR`
    - name is text can be null
    - created_at is date auto generated after creation [required]
    - updated_at is date auto generated after creation when record modified hold modification date via application [required]

  - Relations
    - User have many content [1:M] relation

  - Access pattern
    - User can get his own content via join contents table by created_by key

  - Enhancement
    - If user login depend on email then email key should be indexed to speed up searching
    - If system moved for advanced the role key should be normalized to roles table
    - Define deleting and cascading strategy

- ## Content Table

  - Constrains
    - title is text [required]
    - body is text [required]
    - sector is text closed with enum values: [TECHNOLOGY, HEALTHCARE, FINANCE, EDUCATION, OTHER] [required]
    - status is text closed with enum values: [DRAFT, IN_REVIEW, PUBLISHED] [required] default is `DRAFT`
    - created_by is int follows primary key type from `Users` table
    - created_at is date auto generated after creation [required]
    - updated_at is date auto generated after creation when record modified hold modification date via application [required]
    - status_index is text index in ascending order  [status]
    - sector_index is text index in ascending order [sector]
    - created_at_index date index in ascending order [created_at]
    - created_by_status_index composite index in ascending order [created_by, status]

  - Relations
    - Content should have user [M:1]

  - Access pattern
    - Content can get his author be join created_by with id in users table

  - Enhancement
    - If status scaled more than current it should be normalized to content_status table to avoid updating table schema and indexing which will take time according to table importunacy in system
    - sector can be normalized into sector or tag table for keyword indexing to enhance SEO
    - Can add slug depend on title cleaning for enhance SEO  
    - Define deleting and cascading strategy