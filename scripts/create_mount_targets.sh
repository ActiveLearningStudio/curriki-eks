#!/bin/bash

set -ex

# 1st arg: Cluster name
# 2nd arg: Security Group ID
# 3rd arg: EKS Filesystem ID

# get vpc_id
aws eks describe-cluster --name $1 --query "cluster.resourcesVpcConfig.vpcId" --output text > cluster_vpc_id

# get cidr from vpc
aws ec2 describe-vpcs --vpc-ids $(cat cluster_vpc_id) --query "Vpcs[].CidrBlock" --output text > cluster_cidr_range

# Give permissions to the security group from the cidr range of VPC
aws ec2 authorize-security-group-ingress --group-id $2  --protocol tcp --port 2049 --cidr $(cat cluster_cidr_range)

# Find out all the subnet ids...
aws eks describe-cluster --name $1 --query "cluster.resourcesVpcConfig.subnetIds[]" --output text > subnet_ids

# Now we do the actual work:
for subnet_id in $(cat subnet_ids) ; do aws efs create-mount-target --file-system-id $3 --subnet-id $subnet_id --security-group  $2 ; done