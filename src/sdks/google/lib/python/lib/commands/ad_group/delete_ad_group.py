from ...abstraction.removers.base_remover import BaseRemover
from ...decorators.override_method import override_method
from ...abstraction.commands.base_command import BaseCommand

# command: delete_ad_group
class ExecuteCommand(BaseCommand):
    # DELETE ADGROUP
    def __delete_ad_group(self):
        ad_group_id = self.get_argument("adGroupId")
        resource_name = self.get_resource_by_id("adGroups", ad_group_id)

        # Remover instance
        remover = BaseRemover()

        # Initiate remover
        remover.initiate(self)

        #remove campaign
        result = remover.remove(resource_name=resource_name, resource_type="ad_group")
        return result

    # start execution
    @override_method
    def start_execution(self):
        result = self.__delete_ad_group()

        return result
