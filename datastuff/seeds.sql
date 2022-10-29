

-- This adds department information

INSERT INTO department(name)
VALUES ("Robotics"), ("Design"), ("Frontend"), ("HR"), ("Backend");


-- This adds in job information

INSERT INTO role(title, salary, department_id)

VALUES ("Senior",140000, 2),

    ("Junior",77000, 2),

    ("Consultant",80000, 3),

    ("Secret Agent",85000, 4),

    ("Super Spy",170000, 5),

    ("Developer",124000, 6),

    ("Ninja",96000, 6),

    ("Specialist",130000, 6);


-- This adds new seeded employee info like name etc.

INSERT INTO employee (first_name, last_name, role_id, manager_id)

VALUES ("Rhaenyra", "Targaryen", 2, null),

    ("Daemon", "Targaryen", 4, null),

    ("Ned", "Stark", 6, 3),

    ("Robert", "Barantheon", 3, 4),

    ("Jon", "Snow", 4, 4),

    ("Cersei", "Lannister", 5, 4);


-- This allows the users to see specific employee info

CREATE VIEW employee_info AS

(SELECT
role.id AS role_id,
role.title,
role.salary,
department.name AS department_name
FROM role 
JOIN department 
on role.department_id = department.id);

CREATE VIEW employees_with_managers AS

(SELECT emp.id,
emp.first_name,
emp.last_name,
emp.role_id,
CONCAT(manager.first_name, ' ', manager.last_name) AS manager_name
FROM employee AS manager RIGHT OUTER JOIN employee AS emp ON manager.id = emp.manager_id);

-- References 

-- https://medium.com/@kukreti.ashutosh/episode-2-mysql-database-setup-and-seeding-77873ce06e96

-- https://levelup.gitconnected.com/database-seeding-in-node-js-2b2eec5bfaa1