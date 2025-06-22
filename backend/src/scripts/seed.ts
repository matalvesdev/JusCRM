import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar dados existentes
  await prisma.activity.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.petition.deleteMany();
  await prisma.document.deleteMany();
  await prisma.case.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.lawyerProfile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // Criar usuário administrador
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@juscrm.com",
      password: adminPassword,
      role: "ADMIN",
      provider: "EMAIL",
      isActive: true,
    },
  });

  // Criar advogado principal
  const lawyerPassword = await bcrypt.hash("lawyer123", 12);
  const lawyer = await prisma.user.create({
    data: {
      name: "Dr. João Silva",
      email: "joao@juscrm.com",
      password: lawyerPassword,
      role: "LAWYER",
      provider: "EMAIL",
      isActive: true,
    },
  });

  // Criar perfil do advogado
  await prisma.lawyerProfile.create({
    data: {
      userId: lawyer.id,
      oabNumber: "123456",
      oabState: "SP",
      specialties: ["Direito Trabalhista", "Direito Previdenciário"],
      biography:
        "Advogado especialista em Direito Trabalhista com mais de 10 anos de experiência.",
      experience: 10,
      phone: "(11) 99999-9999",
      address: "Rua das Flores, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567",
    },
  });

  // Criar assistente
  const assistantPassword = await bcrypt.hash("assistant123", 12);
  const assistant = await prisma.user.create({
    data: {
      name: "Maria Santos",
      email: "maria@juscrm.com",
      password: assistantPassword,
      role: "ASSISTANT",
      provider: "EMAIL",
      isActive: true,
    },
  });

  // Criar alguns clientes
  const clients = [];

  for (let i = 1; i <= 5; i++) {
    const client = await prisma.user.create({
      data: {
        name: `Cliente ${i}`,
        email: `cliente${i}@email.com`,
        role: "CLIENT",
        provider: "EMAIL",
        isActive: true,
      },
    });

    const clientProfile = await prisma.clientProfile.create({
      data: {
        userId: client.id,
        type: i % 2 === 0 ? "COMPANY" : "INDIVIDUAL",
        cpf: i % 2 === 0 ? null : `12345678${i.toString().padStart(2, "0")}`,
        cnpj:
          i % 2 === 0 ? `12345678000${i.toString().padStart(2, "0")}` : null,
        phone: `(11) 9999${i}-999${i}`,
        company: i % 2 === 0 ? `Empresa ${i} Ltda` : null,
        position: i % 2 === 0 ? null : `Cargo ${i}`,
        salary: i % 2 === 0 ? null : 3000 + i * 500,
      },
    });

    clients.push(clientProfile);
  }

  // Criar alguns casos
  const caseTypes = [
    "RESCISAO_INDIRETA",
    "HORAS_EXTRAS",
    "ADICIONAL_INSALUBRIDADE",
    "ASSEDIO_MORAL",
    "ACIDENTE_TRABALHO",
  ];

  for (let i = 0; i < clients.length; i++) {
    const case_ = await prisma.case.create({
      data: {
        title: `Caso ${i + 1} - ${caseTypes[i]}`,
        description: `Descrição detalhada do caso ${i + 1}`,
        type: caseTypes[i] as any,
        status: i % 3 === 0 ? "ACTIVE" : i % 3 === 1 ? "DRAFT" : "CLOSED",
        value: 10000 + i * 2000,
        clientId: clients[i]!.id,
        lawyerId: lawyer.id,
        assistantId: i % 2 === 0 ? assistant.id : null,
      },
    });

    // Criar algumas atividades para cada caso
    await prisma.activity.create({
      data: {
        type: "CASE_CREATED",
        title: `Caso ${i + 1} criado`,
        description: `O caso ${case_.title} foi criado com sucesso`,
        userId: lawyer.id,
        caseId: case_.id,
      },
    });
  }

  console.log("✅ Seed concluído com sucesso!");
  console.log("\n📊 Dados criados:");
  console.log("- 1 Administrador (admin@juscrm.com / admin123)");
  console.log("- 1 Advogado (joao@juscrm.com / lawyer123)");
  console.log("- 1 Assistente (maria@juscrm.com / assistant123)");
  console.log("- 5 Clientes");
  console.log("- 5 Casos");
  console.log("- 5 Atividades");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
