import { Construct } from "constructs";

import { Vpc } from "../.gen/providers/aws/vpc";
import { Subnet } from "../.gen/providers/aws/subnet";
import { SecurityGroup } from "../.gen/providers/aws/security-group";
import { InternetGateway } from "../.gen/providers/aws/internet-gateway";
import { RouteTable } from "../.gen/providers/aws/route-table";
import { RouteTableAssociation } from "../.gen/providers/aws/route-table-association";

export class NetworkStack {
  vpc: Vpc;
  subnets: Subnet[];
  sg: SecurityGroup;

  constructor(scope: Construct, cfg: any) {
    this.vpc = new Vpc(scope, "vpc", {
      cidrBlock: "10.0.0.0/16",
      tags: { Name: `${cfg.env}-vpc` }
    });

    const igw = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: { Name: `${cfg.env}-igw` }
    });

    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      route: [
        {
          cidrBlock: "0.0.0.0/0",
          gatewayId: igw.id,
        }
      ],
      tags: { Name: `${cfg.env}-public-rt` }
    });

    this.subnets = ["a", "b"].map((az, i) =>
      new Subnet(scope, `subnet-${az}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: `${cfg.region}${az}`,
        mapPublicIpOnLaunch: true
      })
    );

    this.sg = new SecurityGroup(scope, "ecs-sg", {
      vpcId: this.vpc.id,
      ingress: [
        {
          protocol: "tcp",
          fromPort: cfg.containerPort,
          toPort: cfg.containerPort,
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"]
        }
      ]
    });

    this.subnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `rt-assoc-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      });
    });
  }
}
