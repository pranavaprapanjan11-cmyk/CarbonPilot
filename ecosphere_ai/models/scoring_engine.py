# -*- coding: utf-8 -*-
import random
from datetime import datetime, timedelta
from odoo import models, fields, api, _

class AIInsight(models.Model):
    _name = 'ecosphere.ai.insight'
    _description = 'AI ESG Advisory Insight'
    _order = 'date desc, id desc'

    date = fields.Date(string='Generated Date', default=fields.Date.context_today)
    category = fields.Selection([
        ('environmental', 'Environmental Optimization'),
        ('social', 'Social & CSR Optimization'),
        ('governance', 'Governance & Risk Mitigation')
    ], string='Focus Area', required=True)
    text_insight = fields.Text(string='Recommendation Card', required=True)
    impact_reduction_pct = fields.Float(string='Estimated Impact Improvement %', default=0.0)
    action_taken = fields.Boolean(string='Actioned', default=False)


class ESGScoringEngine(models.TransientModel):
    _name = 'ecosphere.scoring.engine'
    _description = 'ESG Scoring Engine Utility'

    def recalculate_all_scores(self):
        """
        Loops through all departments, computes E, S, and G scores,
        and saves results to standard hr.department model fields.
        """
        departments = self.env['hr.department'].search([])
        today = fields.Date.context_today(self)

        for dept in departments:
            # 1. Environmental Score (40%)
            # Formula: E = 100 * (1 - max(0, current - target) / target)
            target = dept.target_carbon or 250.0
            current = dept.current_carbon or 0.0
            if current <= target:
                e_score = 100.0
            else:
                over_pct = (current - target) / target
                e_score = max(0.0, 100.0 * (1.0 - over_pct))

            # 2. Social Score (30%)
            # Formula: 40% CSR rate, 40% training rate, 20% diversity factor
            employees = self.env['hr.employee'].search([('department_id', '=', dept.id)])
            emp_count = len(employees)
            
            if emp_count > 0:
                # CSR rate
                csr_parts = self.env['ecosphere.csr.participation'].search([
                    ('employee_id', 'in', employees.ids),
                    ('status', '=', 'approved')
                ])
                csr_rate = min(1.0, len(csr_parts) / (emp_count * 2.0)) # expect 2 activities per person

                # Training rate
                training_parts = self.env['ecosphere.training.participation'].search([
                    ('employee_id', 'in', employees.ids),
                    ('status', '=', 'completed')
                ])
                train_rate = min(1.0, len(training_parts) / emp_count)

                # Diversity ratio (male / female / other balance)
                females = len(employees.filtered(lambda e: e.gender == 'female'))
                diversity_ratio = min(1.0, (females / emp_count) * 2.0) # benchmark: 50% female represents 1.0 diversity
            else:
                csr_rate = 0.5
                train_rate = 0.5
                diversity_ratio = 0.5

            s_score = (csr_rate * 40.0) + (train_rate * 40.0) + (diversity_ratio * 20.0)
            s_score = max(0.0, min(100.0, s_score))

            # 3. Governance Score (30%)
            # Formula: Policy acknowledgement rate minus overdue compliance issue deductions
            if emp_count > 0:
                acks = self.env['ecosphere.policy.acknowledgement'].search([
                    ('employee_id', 'in', employees.ids)
                ])
                acks_total = len(acks)
                acks_accepted = len(acks.filtered(lambda a: a.status == 'accepted'))
                ack_rate = acks_accepted / acks_total if acks_total > 0 else 0.8
            else:
                ack_rate = 0.8

            open_issues = self.env['ecosphere.compliance.issue'].search_count([
                ('owner_id', 'in', employees.ids),
                ('status', 'in', ['open', 'overdue'])
            ])
            overdue_issues = self.env['ecosphere.compliance.issue'].search_count([
                ('owner_id', 'in', employees.ids),
                ('status', '=', 'overdue')
            ])

            g_score = (ack_rate * 100.0) - (open_issues * 5.0) - (overdue_issues * 10.0)
            g_score = max(0.0, min(100.0, g_score))

            # Update scores
            dept.write({
                'environmental_score': e_score,
                'social_score': s_score,
                'governance_score': g_score,
                'esg_score': (e_score * 0.40) + (s_score * 0.30) + (g_score * 0.30)
            })

        # Generate AI Insight Recommendations based on newly computed averages
        self._generate_ai_insights()

    def _generate_ai_insights(self):
        """
        Analyzes department data and creates fresh mock AI recommendations.
        """
        self.env['ecosphere.ai.insight'].search([]).unlink() # Clear previous
        
        # Recommendation 1: Carbon High Performers and Offenders
        depts = self.env['hr.department'].search([], order='esg_score asc')
        if depts:
            worst_dept = depts[0]
            self.env['ecosphere.ai.insight'].create({
                'category': 'environmental',
                'text_insight': f"Department '{worst_dept.name}' is currently exceeding carbon targets by {int(max(0, worst_dept.current_carbon - worst_dept.target_carbon))} tCO2e. Recommending switching 30% of their operational fleet vehicles to Electric Vehicles (EVs) to reduce emissions by 18% annually.",
                'impact_reduction_pct': 18.0
            })

            best_dept = depts[-1]
            self.env['ecosphere.ai.insight'].create({
                'category': 'social',
                'text_insight': f"Department '{best_dept.name}' is leading the ESG scorecard with {int(best_dept.esg_score)} points. Suggest standardizing their volunteer paperless program company-wide to capture an additional 5% carbon efficiency.",
                'impact_reduction_pct': 5.0
            })

        # Recommendation 2: Governance / Overdue Issues
        overdue_count = self.env['ecosphere.compliance.issue'].search_count([('status', '=', 'overdue')])
        if overdue_count > 0:
            self.env['ecosphere.ai.insight'].create({
                'category': 'governance',
                'text_insight': f"Detected {overdue_count} overdue compliance audits. Directing automatic notification reminders to remediation owners will reduce risk exposure and raise the Company Governance Score by 12%.",
                'impact_reduction_pct': 12.0
            })

        # Default standard recommendations
        self.env['ecosphere.ai.insight'].create({
            'category': 'environmental',
            'text_insight': "Company-wide server energy optimization: Shutting down idle testing virtual machines outside working hours could save 14,000 kWh monthly, reducing ESG Environmental overhead by 4.2 tCO2e.",
            'impact_reduction_pct': 4.2
        })

    def seed_demo_data(self):
        """
        Populate DB with rich hackathon demo data.
        """
        # 1. Clear existing ESG data to ensure clean seed
        self.env['ecosphere.emission.factor'].search([]).unlink()
        self.env['ecosphere.carbon.transaction'].search([]).unlink()
        self.env['ecosphere.sustainability.goal'].search([]).unlink()
        self.env['ecosphere.csr.activity'].search([]).unlink()
        self.env['ecosphere.csr.participation'].search([]).unlink()
        self.env['ecosphere.sustainability.training'].search([]).unlink()
        self.env['ecosphere.training.participation'].search([]).unlink()
        self.env['ecosphere.policy'].search([]).unlink()
        self.env['ecosphere.policy.acknowledgement'].search([]).unlink()
        self.env['ecosphere.audit'].search([]).unlink()
        self.env['ecosphere.compliance.issue'].search([]).unlink()
        self.env['ecosphere.challenge'].search([]).unlink()
        self.env['ecosphere.challenge.participation'].search([]).unlink()
        self.env['ecosphere.badge'].search([]).unlink()
        self.env['ecosphere.reward.marketplace'].search([]).unlink()
        self.env['ecosphere.reward.redemption'].search([]).unlink()

        # 2. Create 10 Departments
        dept_names = [
            'Administration & HR', 'Finance & Accounting', 'Research & Development',
            'Product Engineering', 'Sales & Marketing', 'Customer Success',
            'Global Logistics', 'Operations & Manufacturing', 'Legal & Compliance',
            'IT & Infrastructure'
        ]
        departments = self.env['hr.department'].search([('name', 'in', dept_names)])
        existing_names = departments.mapped('name')
        
        dept_list = []
        for name in dept_names:
            if name not in existing_names:
                dept_list.append(self.env['hr.department'].create({
                    'name': name,
                    'target_carbon': random.randint(180, 400)
                }))
            else:
                dept_list.append(departments.filtered(lambda d: d.name == name)[0])

        # 3. Create 100 Employees
        first_names = ['Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Charlotte', 'William', 'Sophia',
                       'James', 'Amelia', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Evelyn', 'Alexander', 'Harper']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin']
        genders = ['male', 'female', 'other']
        
        employees = self.env['hr.employee'].search([])
        emp_list = list(employees)
        
        # If we have less than 100 employees, seed up to 100
        needed_emps = 100 - len(employees)
        if needed_emps > 0:
            for i in range(needed_emps):
                fn = random.choice(first_names)
                ln = random.choice(last_names)
                dept = random.choice(dept_list)
                gender = random.choice(genders)
                emp = self.env['hr.employee'].create({
                    'name': f"{fn} {ln}",
                    'department_id': dept.id,
                    'gender': gender,
                    'xp_points': random.randint(150, 2500),
                    'sustainability_score': random.randint(55, 95),
                    'work_email': f"{fn.lower()}.{ln.lower()}@ecosphere-company.com"
                })
                emp_list.append(emp)

        # 4. Create Emission Factors
        factors_data = [
            ('Grid Electricity', 'purchase', 'kWh', 0.385),
            ('Natural Gas Heating', 'purchase', 'm3', 2.05),
            ('Water Consumption', 'purchase', 'm3', 0.298),
            ('Industrial Fuel', 'manufacturing', 'Liters', 2.68),
            ('Raw Aluminum Alloys', 'manufacturing', 'kg', 8.24),
            ('Recycled Cardboard', 'manufacturing', 'kg', 0.52),
            ('Executive Jet Flight', 'fleet', 'Passenger-km', 0.25),
            ('Logistics Truck diesel', 'fleet', 'km', 0.81),
            ('EV Delivery Van charge', 'fleet', 'kWh', 0.09),
            ('Hotel Room Nights', 'expenses', 'Nights', 18.4),
            ('Train Commute Business', 'expenses', 'Passenger-km', 0.041),
            ('Car Rental Fuel', 'expenses', 'Liters', 2.31),
        ]
        factors = []
        for name, category, unit, val in factors_data:
            factors.append(self.env['ecosphere.emission.factor'].create({
                'name': name,
                'category': category,
                'unit': unit,
                'carbon_value': val,
                'status': 'active'
            }))

        # 5. Create 200 Carbon Transactions
        today_dt = datetime.now()
        for i in range(200):
            days_ago = random.randint(1, 365)
            tx_date = today_dt - timedelta(days=days_ago)
            dept = random.choice(dept_list)
            emp = random.choice([e for e in emp_list if e.department_id.id == dept.id])
            factor = random.choice(factors)
            
            qty = random.randint(200, 10000) if factor.unit == 'kWh' else random.randint(5, 500)
            
            tx = self.env['ecosphere.carbon.transaction'].create({
                'name': f"TX-2026-{i:04d}",
                'date': tx_date.date(),
                'department_id': dept.id,
                'employee_id': emp.id,
                'source': factor.category,
                'emission_factor_id': factor.id,
                'quantity': qty,
                'status': 'posted'
            })
            tx._compute_carbon_emission()

        # 6. Create 50 CSR Activities
        csr_titles = [
            'Urban Reforestation & Planting', 'River Bank Clean-up Initiative', 
            'Annual E-Waste Recycling Drive', 'Coastal Beach Clean-up Campaign',
            'Solar Panel Orientation Seminar', 'Sustainable Operations Audit Work',
            'Carbon Neutral Logistics Webinar', 'Community Kitchen Organic Sourcing',
            'School Green Spaces Workshop', 'Wildlife Sanctuary volunteering'
        ]
        csr_activities = []
        for i in range(50):
            title = random.choice(csr_titles)
            days_diff = random.randint(-180, 180)
            act_date = today_dt + timedelta(days=days_diff)
            csr_activities.append(self.env['ecosphere.csr.activity'].create({
                'title': f"{title} - Batch #{i+1}",
                'category': random.choice(['volunteering', 'community', 'education', 'charity']),
                'date': act_date.date(),
                'budget': random.randint(500, 5000),
                'points_reward': random.randint(40, 150),
                'status': 'completed' if days_diff < 0 else 'open'
            }))

        # Create CSR Participations (many-to-many link)
        for act in csr_activities:
            # Let random 3-10 employees participate
            participants = random.sample(emp_list, k=random.randint(3, 10))
            for emp in participants:
                self.env['ecosphere.csr.participation'].create({
                    'employee_id': emp.id,
                    'activity_id': act.id,
                    'status': 'approved' if act.status == 'completed' else 'draft',
                    'proof': "Participated fully and logged hours."
                })

        # 7. Create 25 Sustainability Goals
        goals_data = [
            ('Reduce HQ Electricity Consumption', 'purchase', 50.0),
            ('Minimise Logistics Truck Diesel', 'fleet', 120.0),
            ('Upgrade Manufacturing Raw Materials', 'manufacturing', 80.0),
            ('Optimize Employee Business Flights', 'expenses', 30.0),
            ('Water Conservation in R&D Labs', 'purchase', 25.0),
        ]
        for i in range(25):
            name, cat, target_v = random.choice(goals_data)
            dept = random.choice(dept_list)
            days_due = random.randint(-30, 200)
            due_dt = today_dt + timedelta(days=days_due)
            self.env['ecosphere.sustainability.goal'].create({
                'name': f"{name} ({dept.name})",
                'department_id': dept.id,
                'target_value': target_v,
                'current_value': random.uniform(0.0, target_v * 1.2),
                'due_date': due_dt.date()
            })

        # 8. Create 25 ESG Policies
        policy_names = [
            'Zero Waste Corporate Mandate', 'Renewable Energy Procurement Policy',
            'Business Travel Carbon Offset Protocol', 'Supplier Code of Sustainability',
            'Employee Diversity & Equal Opportunity', 'Anti-Bribery and Corruption Framework',
            'Ethical Sourcing & Fair Trade Guidelines', 'Fleet Electrification Directive'
        ]
        policies = []
        for i in range(25):
            name = random.choice(policy_names)
            policies.append(self.env['ecosphere.policy'].create({
                'name': f"{name} v{i//5}.{i%5}",
                'category': random.choice(['environmental', 'social', 'governance', 'code_of_conduct']),
                'version': f"{i//5}.{i%5}",
                'content': "Detailed enterprise governance rules concerning environmental metrics.",
                'status': 'active' if i < 20 else 'draft'
            }))

        # Generate policy acknowledgements (employees review policies)
        active_policies = [p for p in policies if p.status == 'active']
        for pol in active_policies:
            # Seed 70% accepted, 30% pending
            sample_size = len(emp_list)
            accepted_emps = random.sample(emp_list, k=int(sample_size * 0.75))
            for emp in emp_list:
                status = 'accepted' if emp in accepted_emps else 'pending'
                self.env['ecosphere.policy.acknowledgement'].create({
                    'employee_id': emp.id,
                    'policy_id': pol.id,
                    'status': status,
                    'date_acknowledged': today_dt - timedelta(days=random.randint(1, 30)) if status == 'accepted' else False
                })

        # 9. Create 50 Compliance Issues
        issue_titles = [
            'Incomplete Carbon log for Logistics fleet', 'R&D Boiler safety check overdue',
            'Factory floor emergency exit obstructed', 'Vendor sustainability audit missing signature',
            'IT server farm HVAC sensor malfunction', 'Hazardous waste log missing batch stamp'
        ]
        for i in range(50):
            emp = random.choice(emp_list)
            days_due = random.randint(-40, 60)
            due_dt = today_dt + timedelta(days=days_due)
            status = 'resolved' if days_due < -10 else ('overdue' if days_due < 0 else random.choice(['open', 'under_review']))
            self.env['ecosphere.compliance.issue'].create({
                'title': f"{random.choice(issue_titles)} #{i+1}",
                'severity': random.choice(['low', 'medium', 'high', 'critical']),
                'owner_id': emp.id,
                'due_date': due_dt.date(),
                'status': status,
                'resolution_notes': "Root cause identified. Training scheduled and checklist updated." if status == 'resolved' else ""
            })

        # 10. Create 50 Badges
        badge_types = [
            ('Eco Warrior', 'eco_warrior', 'Participation in 3+ CSR campaigns'),
            ('Carbon Hero', 'carbon_hero', 'Reduction of personal carbon footprint by 15%'),
            ('Green Leader', 'green_leader', 'Leading a completed ESG challenge'),
            ('Planet Protector', 'planet_protector', 'Zero waste office space contribution'),
            ('Net Zero Champion', 'net_zero_champion', 'Redeemed premium carbon offset awards')
        ]
        badge_objects = []
        for i in range(50):
            title, symbol, crit = random.choice(badge_types)
            badge_objects.append(self.env['ecosphere.badge'].create({
                'name': f"{title} Level {i%5 + 1}",
                'description': crit,
                'badge_type': symbol
            }))

        # Link random badges to employees
        for emp in emp_list:
            emp.badge_ids = [(6, 0, [b.id for b in random.sample(badge_objects, k=random.randint(1, 4))])]

        # 11. Create 50 Rewards
        reward_names = [
            ('Amazon Gift Card', 200), ('Company Eco-Merch (Tote/Bottle)', 150),
            ('Extra Paid Leave Day', 1500), ('Premium Coffee Mug (Recycled)', 100),
            ('Charity Donation in Your Name', 400), ('Electric Bicycle Subscription (1 Mo)', 800),
            ('Tree Planting Dedication', 250), ('VIP Executive Lunch Meeting', 1200)
        ]
        reward_objects = []
        for i in range(50):
            name, cost = random.choice(reward_names)
            reward_objects.append(self.env['ecosphere.reward.marketplace'].create({
                'name': f"{name} #{i+1}",
                'cost_xp': cost,
                'description': "Enterprise rewards honoring sustainable employee actions.",
                'stock': random.randint(1, 15)
            }))

        # Create some redemptions
        for i in range(30):
            emp = random.choice(emp_list)
            rew = random.choice(reward_objects)
            if emp.xp_points >= rew.cost_xp and rew.stock > 0:
                self.env['ecosphere.reward.redemption'].create({
                    'employee_id': emp.id,
                    'reward_id': rew.id,
                    'status': random.choice(['pending', 'delivered'])
                })

        # 12. Create Trainings
        trainings = [
            self.env['ecosphere.sustainability.training'].create({
                'name': 'Corporate Waste Audits & Segregation',
                'duration_hours': 2.0,
                'description': 'How to identify recyclable, compostable, and general waste streams.'
            }),
            self.env['ecosphere.sustainability.training'].create({
                'name': 'Office Carbon Footprint Mitigation',
                'duration_hours': 1.5,
                'description': 'Best practices to conserve heat, power, and travel emissions.'
            }),
            self.env['ecosphere.sustainability.training'].create({
                'name': 'ESG Governance and Auditing standards',
                'duration_hours': 3.0,
                'description': 'Comprehensive framework for business policy compliance.'
            })
        ]

        # Seed training completion records
        for emp in emp_list:
            for train in trainings:
                pct = 100.0 if random.random() > 0.3 else random.uniform(20.0, 90.0)
                self.env['ecosphere.training.participation'].create({
                    'employee_id': emp.id,
                    'training_id': train.id,
                    'completion_pct': pct
                })

        # Recalculate everything to generate live dashboard statistics
        self.recalculate_all_scores()
