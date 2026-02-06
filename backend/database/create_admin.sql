SELECT UserID, Username, Email, Role FROM Users;

-- Update user của bạn thành Admin (thay Email)
UPDATE Users 
SET Role = 'Admin' 
WHERE Email = 'tran@gmail.com';
