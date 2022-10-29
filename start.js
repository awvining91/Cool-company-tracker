//Reduired dependencies are below



const mysql = require('mysql2');

const cTable = require('console.table');

const inquirer = require('inquirer');

const db = mysql.createConnection(

    {
      host: 'localhost',

      user: 'root',

      password: 'none',

      database: 'tracker_db'
    },
    console.log(`Connection with tracker_db database complete`)
);



//------------------------------------------------------------------------------------------------------------------------------------//

const questionGenerate = () => {

    return inquirer.prompt([
        {
            type: 'list',
            message: "What do you want to do?",
            name: 'choices',
            choices: [
                "View all departments",
                "View all roles",
                "View all employees",
                "Add a department",
                "Add a role",
                "Add an employee",
                "Update an employee role"
            ]
        }
    ])
    .then((info) => {
        switch (info.selection) {
            case "View all departments":
                seeDeps();
                break;

            case "View all roles":
                seeJobs();
                break;
                
            case "View all employees":
                seeWorkers();
                break;
            
            case "Add a department":
                newDep();
                break;
        
            case "Add a role":
                newJob();
                break;
            
            case "Add an employee":
                newWorker();
                break;
                
            case "Update an employee role":
                newJobDescription();
                break;
        }
    })
};

//----------------------------------------------------------------------------------------------------------------------------------//

// Initiates user prompt
questionGenerate();

const seeDeps = () => {
    db.query(`SELECT * FROM department`, function (err, response) {
        console.log(`\n`);
        console.table(response);
        questionGenerate();
    })
}


//-----------------------------------------------------------------------------------------------------------------------------------//

const seeJobs = () => {
    db.query(`SELECT * FROM role`, function (err, response) {
        console.log(`\n`);
        console.table(response);
        questionGenerate();
    })
}

//----------------------------------------------------------------------------------------------------------------------------------//

const seeWorkers = () => {
    db.query(`
    SELECT
    employees_with_managers.id AS employee_id,
    employees_with_managers.first_name,
    employees_with_managers.last_name,
    employee_info.title,
    employee_info.salary,
    employee_info.department_name,
    employees_with_managers.manager_name
    FROM employee_info
    JOIN employees_with_managers on employee_info.role_id = employees_with_managers.role_id;
    `, function (err, response) {
        console.log(`\n`);
        console.table(response);
        questionGenerate();
    })
}

//-----------------------------------------------------------------------------------------------------------------------------------//
const newDep = () => {
    return inquirer.prompt([
        {
            type: 'input',
            message: "What is the name of the new department?",
            name: 'name'
        }
    ])
    .then((info) => {
        db.query(`INSERT INTO department (name) VALUES (?)`, info.name, (err, response) => {
            console.log("\nNew department added. See below:");
            seeDeps();
        })
    })
}


//--------------------------------------------------------------------------------------------------------------------------------------//
const newJob = () => {
    let departmentArray = [];
    db.query(`SELECT * FROM department`, function (err, response) {
        for (let i = 0; i < response.length; i++) {
            departmentArray.push(response[i].name);
        }
        return inquirer.prompt([
            {
                type: 'input',
                message: "What is the name of the new role?",
                name: 'title',
            },
            {
                type: 'input',
                message: "What is the salary of the new role?",
                name: 'salary',
            },
            {
                type: 'list',
                message: "What department is the role under?",
                name: 'department',
                choices: departmentArray
            }
        ])
        .then((info) => {
            // Get's department id
            db.query(`SELECT id FROM department WHERE department.name = ?`, info.department, (err, response) => {
                let department_id = response[0].id;
            db.query(`INSERT INTO role(title, salary, department_id)
            VALUES (?,?,?)`, [info.title, info.salary, department_id], (err, response) => {
                console.log("\nNew role added. See below:");
                seeJobs();
            })
            });
        })
    })
}

//-----------------------------------------------------------------------------------------------------------------------------------//

const newWorker = () => {
    const roleArray= [];
    const employeeArray= [];
    // populates role array with all roles
    db.query(`SELECT * FROM role`, function (err, response) {
        for (let i = 0; i < response.length; i++) {
            roleArray.push(response[i].title);
        }
    // populates employee array with all employees
    db.query(`SELECT * FROM employee`, function (err, response) {
        for (let i = 0; i < response.length; i++) {
            let employeeName = `${response[i].first_name} ${response[i].last_name}`
            employeeArray.push(employeeName);
        }
        return inquirer.prompt([
            {
                type: 'input',
                message: "What is the employee's first name?",
                name: 'first_name',
            },
            {
                type: 'input',
                message: "What is the employee's last name?",
                name: 'last_name',
            },
            {
                type: 'list',
                message: "What is the employee's role?",
                name: 'role',
                choices: roleArray
            },
            {
                type: 'list',
                message: "Does the employee have a manager?",
                name: 'has_manager',
                choices: ["Yes", "No"]
            }
        ]).then((info) => {
            let roleName = info.role;
            let first_name = info.first_name;
            let last_name = info.last_name;
            let role_id = '';
            let manager = '';
            // populates role id
            db.query(`SELECT id FROM role WHERE role.title = ?`, info.role, (err, response) => {
                role_id = response[0].id;
            });
            if (info.has_manager === "Yes") {
                return inquirer.prompt([
                    {
                    type: 'list',
                    message: "Please select the employees manager",
                    name: 'manager',
                    choices: employeeArray
                    }   
                ]).then((info) => {
                    // get role id
                    db.query(`SELECT id FROM role WHERE role.title = ?`, roleName, (err, response) => {
                        role_id = response[0].id;
                    })
                    db.query(`SELECT id FROM employee WHERE employee.first_name = ? AND employee.last_name = ?;`, info.manager.split(" "), (err, response) => {
                        manager = response[0].id;
                        db.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) 
                        VALUES (?,?,?,?)`, [first_name, last_name, role_id, manager], (err, response) => {
                            console.log("\nNew employee added. See below:");
                            seeWorkers();
                        })
                    })
                })
            } else {
                // sets manager to null
                manager = null;
                // get role id
                db.query(`SELECT id FROM role WHERE role.title = ?`, roleName, (err, response) => {
                    role_id = response[0].id;
                    // query 555 still doesnt work even when manager is null
                    db.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) 
                    VALUES (?,?,?,?)`, [info.first_name, info.last_name, role_id, manager], (err, response) => {
                        console.log("\nNew employee added. See below:");
                        seeWorkers();
                    })
                })
            }
        })
    })
})
}

//-----------------------------------------------------------------------------------------------------------------------------------//

const newJobDescription = () => {
    const roleArray= [];
    const employeeArray= [];
    // populates role array with all roles
    db.query(`SELECT * FROM role`, function (err, response) {
        for (let i = 0; i < response.length; i++) {
            roleArray.push(response[i].title);
        }
    // populates employee array with all employees
    db.query(`SELECT * FROM employee`, function (err, response) {
        for (let i = 0; i < response.length; i++) {
            let employeeName = `${response[i].first_name} ${response[i].last_name}`
            employeeArray.push(employeeName);
        }
        return inquirer.prompt([
            {
                type: 'list',
                message: "Which employee do you want to update?",
                name: 'employee',
                choices: employeeArray
            },
            {
                type: 'list',
                message: "What is the employee's new role?",
                name: 'role',
                choices: roleArray
            },
        ]).then((info) => {
            // get role id
            db.query(`SELECT id FROM role WHERE role.title = ?;`, info.role, (err, response) => {
                role_id = response[0].id;
                db.query(`SELECT id FROM employee WHERE employee.first_name = ? AND employee.last_name = ?;`, info.employee.split(" "), (err, response) => {
                    db.query(`UPDATE employee SET role_id = ? WHERE id = ?;`, [role_id, response[0].id], (err, response) => {
                        console.log("\nEmployee role updated. See below:");
                        seeWorkers();
                    })
                })

            })
        })
    })
})
}

/* References


- https://www.npmjs.com/package/inquirer

- https://dev.to/rushankhan1/build-a-cli-with-node-js-4jbi

- https://developer.okta.com/blog/2019/03/11/node-sql-server

- https://www.simplilearn.com/tutorials/nodejs-tutorial/nodejs-mysql

- https://www.tutorialsteacher.com/nodejs/access-sql-server-in-nodejs

- https://www.npmjs.com/package/sql-client

- https://www.telerik.com/blogs/step-by-step-create-node-js-rest-api-sql-server-database

- https://docs.databricks.com/dev-tools/nodejs-sql-driver.html

- https://www.npmjs.com/package/mysql2

- https://stackoverflow.com/questions/25344661/what-is-the-difference-between-mysql-mysql2-considering-nodejs

- https://npmcompare.com/compare/mysql,mysql2 



*/