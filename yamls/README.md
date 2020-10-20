# AWS Stack

![](../images/EKS-CloudFormationDiagram.png)

# Deploying to kubernetes.

Below are the steps needed to install CurrikiStudio on a kubernetes cluster.

### Prerequisites
PostgreSQL and Elasticsearch databases are already provisioned, and we have a `.env` file with the proper environment variables pointing to those databases.

### Create EKS Cluster

An example command is `eksctl create cluster --name amedhi-test-cluster --nodegroup-name=amedhi-test-cluster-nodegroup --nodes=1 --nodes-max=2 --region=us-east-2 --version=1.17`. See the documentation on AWS for more details, which can be found [here](https://docs.aws.amazon.com/eks/latest/userguide/getting-started-eksctl.html).


### Create secret for the API and client.

Run these commands to create the secret with the API and Client environment variables:
```
kubectl create secret generic currikidev-api-secret --from-file=.env
kubectl create secret generic currikidev-client-secret --from-file=.env.local
```
If you wish to change the content of the secret, just edit the files `.env` and `.env.local` in this directory.


### Install Istio (kubernetes networking extension)
Istio is a kubernetes extension that provides advanced yet easy-to-use features for Observability, Traffic Routing + Networking, and Security.
Go to http://istio.io for instructions on downloading the `istioctl` utility. Then, we can simply use the default capabilities of istio as we don't need anything too fancy:
```istioctl install --set profile=default```

To enable a demo of prometheus and grafana, run the following:
```
kubectl apply -f https://raw.githubusercontent.com/istio/istio/master/samples/addons/prometheus.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/master/samples/addons/grafana.yaml
```

To view one of the two dashboards, run `istioctl dashboard {grafana,prometheus}`.

*TODO*: create instructions for a production deployment of prometheus and grafana. Right now, the commands above enable a demo version (it may or may not be robust).

### Enable EFS-backed PersistentVolumes
By default, EKS uses EBS for the backend storage for its `PersistentVolume` implementation. Unfortunately, EBS-backed `PersistentVolume`s only support the `ReadWriteOnce` access mode, which means they can only be accessed by pods on the same node. This does not scale well. However, we can enable the `ReadWriteMany` access mode with EFS. See this documentation [here](https://aws.amazon.com/premiumsupport/knowledge-center/eks-persistent-storage/). Use the second option for EFS, not EBS. Make careful note of the output of all create commands.

#### Important note: You will need to edit the `api.yaml` file to include the `volumeHandle` with the id of the volumeHandle created. The `api.yaml` file WILL NOT WORK until this change is made. Specifically, you will need to change the string `fs-537b34b3` to whatever ID AWS returns when you create the volume mount.


### Deploy the API and Client
Edit the `api.yaml` file to point to the PersistentVolume `volumeHandle` to point to your EFS filesystem. Next, edit both the `api.yaml` and `client.yaml` files' "Deployment" sections to point to the image that you want to deploy. Once you've configured the files (*TODO* write a bash script that does this step automatically), run this:
```
kubectl apply -f client.yaml
kubectl apply -f api.yaml
```

### Deploy the istio networking files
```
kubectl apply -f istio.yaml

kubectl get svc -nistio-system
```
Look at the `istio-ingressgateway` service's External IP. You can now access the Client at that Loadbalancer's URL.

### Enable a nice domain name
Navigate to AWS Route53, and create a record that routes traffic from `my-test-deployment.curriki.org` to the Loadbalancer of the istio-ingressgateway.

### *TODO*: Find out how to enable HTTPS.
See the Istio documentation on Secure Gateways. This seems like a reasonable place to start.


# What's in this Directory?

* The `.env` and `.env.local` files are the environment variable configurations for the api and client, respectively.
* The `api.yaml` and `api.demo.yaml` files are files to deploy the API. The `demo` file does not use EFS for PersistentVolumes in case a tester wants to do a quick deployment without setting up EFS (as that takes a while).
* `client.yaml` deploys the react client.
* `istio.yaml` configures the Istio traffic management and routing.
* In the `..` directory, there is a `Makefile` which allows you to build the API and Client docker containers.

# TODO's

* Enable HTTPS. I think this is a good start [right here](https://istio.io/latest/docs/tasks/traffic-management/ingress/secure-ingress/).
* Enable production Prometheus and Grafana.
* Write scripts to automate deployment (build with a certain tag and use `sed` or something to edit the yaml files and specify an image tag automatically).
* If Ali decides to use .env files rather than environment variables, change the way we use Secrets.


# Example Script To Enable EFS:

This is by no means fully comprehensive, but take a look. NOTE: replace `curriki-eks-cluster-2` with the proper name of your cluster.

```
kubectl apply -k "github.com/kubernetes-sigs/aws-efs-csi-driver/deploy/kubernetes/overlays/stable/?ref=master"
aws eks describe-cluster --name curriki-eks-cluster-2 --query "cluster.resourcesVpcConfig.vpcId" --output text > cluster_vpc_id
aws ec2 describe-vpcs --vpc-ids $(cat cluster_vpc_id) --query "Vpcs[].CidrBlock" --output text > cluster_cidr_range

echo "curriki-efs-eks-sg" > sg_name
aws ec2 create-security-group --description efs-test-sg --group-name $(cat sg_name) --vpc-id $(cat cluster_vpc_id) > sg_output

cat sg_output
```
At this point, look at the output of sg_output and create a file `sg_id` with the security group id from that file.

```
aws ec2 authorize-security-group-ingress --group-id $(cat sg_id)  --protocol tcp --port 2049 --cidr $(cat cluster_cidr_range)
aws efs create-file-system --creation-token eks-efs > efs_output
cat efs_output
```

Once again, create a file `efs_filesystem_id` from the Filesystem Id that you see from above.

The last part is tricky—we need to create a mount target for each subnet in the VPC. So first we get the subnets:

```
aws eks describe-cluster --name curriki-eks-cluster-2 --query "cluster.resourcesVpcConfig.subnetIds[]" --output text > subnet_ids

# then, we create the mount targets
for subnet_id in $(cat subnet_ids) ; do aws efs create-mount-target --file-system-id $(cat efs_filesystem_id) --subnet-id $subnet_id --security-group  $(cat sg_id) ; done
```

Lastly:

```
cat efs_filesystem_id
```
And use that id as the volumeHandle in the `api.yaml` file.

# *NOTE*
The above section came fully from here: https://aws.amazon.com/premiumsupport/knowledge-center/eks-persistent-storage/
