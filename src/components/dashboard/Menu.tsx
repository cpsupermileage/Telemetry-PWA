import { MenuIcon } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import Widget from './Widget';
import { useNavigate } from 'react-router';

function Menu() {
	const navigate = useNavigate();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button type="button" className="cursor-pointer">
					<Widget className="p-2">
						<MenuIcon />
					</Widget>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={() => void navigate('/')}>Home</DropdownMenuItem>
					<DropdownMenuItem onClick={() => void navigate('/driver/dashboard')}>Driver Dashboard</DropdownMenuItem>
					<DropdownMenuItem onClick={() => void navigate('/spectator/dashboard')}>Spectator Dashboard</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default Menu;
